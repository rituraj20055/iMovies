const axios = require('axios');

const API_BASE = 'http://localhost:5050/api';

async function runTests() {
  console.log('🧪 VERIFYING MOVIE DELETION & ADMIN ROUTES...');
  let adminToken = '';

  try {
    // 1. Admin login
    const loginRes = await axios.post(`${API_BASE}/auth/admin/login`, {
      email: 'admin@imovies.com',
      password: 'admin123',
    });
    if (!loginRes.data.success || !loginRes.data.token) {
      throw new Error('Admin login failed');
    }
    adminToken = loginRes.data.token;
    console.log('✅ 1. Admin login succeeded');

    const authHeaders = {
      headers: {
        'auth-token': adminToken,
        Authorization: `Bearer ${adminToken}`,
      },
    };

    // 2. Add movie with 0 bookings
    const addRes = await axios.post(
      `${API_BASE}/movie`,
      {
        name: `Test Deletion Movie ${Date.now()}`,
        description: 'Temporary movie to verify clean deletion endpoint and catalogue sync',
        genres: ['Action', 'Sci-Fi'],
        releaseDate: '2026-11-01',
        language: 'English',
        duration: '2h 10m',
        certification: 'U/A',
        poster: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=500',
        trailer: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      },
      authHeaders
    );
    const movie1 = addRes.data.movie;
    const movie1Id = movie1._id;
    console.log(`✅ 2. Created movie with ID: ${movie1Id} ("${movie1.movieName || movie1.name}")`);

    // 3. Verify it appears in active catalogue
    const catRes1 = await axios.get(`${API_BASE}/movie`, authHeaders);
    const inCatalog1 = (catRes1.data.movies || []).some((m) => String(m._id) === String(movie1Id));
    if (!inCatalog1) throw new Error('Movie not found in catalog after creation');
    console.log('✅ 3. Movie confirmed present in active catalogue');

    // 4. Delete the movie (0 bookings -> hard deletion)
    const delRes1 = await axios.delete(`${API_BASE}/movie/${movie1Id}`, authHeaders);
    console.log(`✅ 4. Delete response: ${delRes1.data.message || 'Success'}`);

    // 5. Verify movie is completely removed from catalogue
    const catRes2 = await axios.get(`${API_BASE}/movie`, authHeaders);
    const inCatalog2 = (catRes2.data.movies || []).some((m) => String(m._id) === String(movie1Id));
    if (inCatalog2) throw new Error('Deleted movie still appears in active catalogue!');
    console.log('✅ 5. Verified movie is completely removed from active catalogue');

    // 6. Test Movie Deletion with booking history (Safe Archiving)
    const addRes2 = await axios.post(
      `${API_BASE}/movie`,
      {
        name: `Archival Test Movie ${Date.now()}`,
        description: 'Movie to test financial preservation and safe archiving when bookings exist',
        genres: ['Drama'],
        releaseDate: '2026-11-15',
        language: 'English',
        duration: '1h 55m',
        certification: 'U',
      },
      authHeaders
    );
    const movie2 = addRes2.data.movie;
    const movie2Id = movie2._id;
    console.log(`✅ 6. Created archival test movie: ${movie2Id}`);

    // Create a show for this movie
    const theatreRes = await axios.get(`${API_BASE}/theatre`, authHeaders);
    const theatres = theatreRes.data.theatres || [];
    if (theatres.length === 0) throw new Error('No theatres available');
    const theatre = theatres[0];

    const showRes = await axios.post(
      `${API_BASE}/shows`,
      {
        movieId: String(movie2Id),
        movieName: movie2.movieName || movie2.name,
        theatreId: theatre.theatreId,
        theatreName: theatre.theatreName,
        showDate: '2026-11-15',
        showTime: '18:00',
        ticketPrice: 250,
      },
      authHeaders
    );
    const show = showRes.data.show;
    console.log(`✅ 7. Created show for archival movie (Show ID: ${show.showId})`);

    // Create a booking on this show
    const userLoginRes = await axios.post(`${API_BASE}/auth/login`, {
      email: 'user@imovies.com',
      password: 'user123',
    });
    const userToken = userLoginRes.data.token;
    const userHeaders = { headers: { 'auth-token': userToken } };

    const bookingRes = await axios.post(
      `${API_BASE}/bookings`,
      {
        showId: show.showId,
        userEmail: 'user@imovies.com',
        selectedSeats: ['balcony_A1'],
        ticketsData: { balcony_A1: { tier: 'balcony', price: 250 } },
        totalAmount: 250,
      },
      userHeaders
    );
    const booking = bookingRes.data.booking;
    console.log(`✅ 8. Created confirmed booking ${booking.bookingId} on movie`);

    // Delete movie with active bookings
    const delRes2 = await axios.delete(`${API_BASE}/movie/${movie2Id}`, authHeaders);
    console.log(`✅ 9. Archive delete response: "${delRes2.data.message}" (Archived: ${delRes2.data.archived})`);
    if (!delRes2.data.archived) {
      throw new Error('Movie with bookings should have been safely archived, not hard-deleted!');
    }

    // Verify it is hidden from the public movie catalog
    const catRes3 = await axios.get(`${API_BASE}/movie`, authHeaders);
    const inCatalog3 = (catRes3.data.movies || []).some((m) => String(m._id) === String(movie2Id));
    if (inCatalog3) throw new Error('Archived movie still appears in active catalog!');
    console.log('✅ 10. Verified archived movie is hidden from active catalog');

    // Verify the customer booking is intact and undisturbed
    const userBookings = await axios.get(`${API_BASE}/bookings/user/user@imovies.com`, userHeaders);
    const hasBooking = (userBookings.data.bookings || []).some((b) => b.bookingId === booking.bookingId);
    if (!hasBooking) throw new Error('Customer booking was lost during movie deletion!');
    console.log('✅ 11. Customer booking history and financial record safely preserved');

    // 12. Verify Admin Bookings route
    const adminBookingsRes = await axios.get(`${API_BASE}/bookings/admin/all`, authHeaders);
    console.log(`✅ 12. Admin bookings endpoint returned ${adminBookingsRes.data.bookings?.length || 0} reservations`);

    // 13. Verify Admin Transactions route
    const adminTxRes = await axios.get(`${API_BASE}/admin/transactions`, authHeaders);
    console.log(`✅ 13. Admin transactions endpoint returned ${adminTxRes.data.transactions?.length || 0} transactions (Total Rev: ₹${adminTxRes.data.stats?.totalRevenue || 0})`);

    console.log('\n🎉 ALL 13 MOVIE DELETION & ADMIN TESTS PASSED PERFECTLY!\n');
  } catch (err) {
    console.error('❌ Test failed:', err.response?.data || err.message);
    process.exit(1);
  }
}

runTests();
