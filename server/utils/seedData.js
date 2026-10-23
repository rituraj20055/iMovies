const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const User = require('../models/userModel');
const Admin = require('../models/adminModel');
const Movie = require('../models/movieModel');
const Theatre = require('../models/theatreModel');
const Show = require('../models/showModel');
const Review = require('../models/reviewModel');
const dayjs = require('dayjs');
const tmdbService = require('../services/tmdbService');
const { deduplicateDatabaseMovies } = require('./dedupMovies');

const generateSeatLayout = (rows, cols) => {
  const seats = {};
  const rowLabels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  for (let r = 0; r < rows; r++) {
    for (let c = 1; c <= cols; c++) {
      const seatId = `${rowLabels[r]}${c}`;
      seats[seatId] = { status: 'available' };
    }
  }
  return seats;
};

const buildInitialTickets = (theatre) => {
  const tickets = {};
  const buildSection = (seats, tier, price) => {
    Object.keys(seats || {}).forEach(seatId => {
      tickets[`${tier}_${seatId}`] = { status: 'available', tier, price, seatId };
    });
  };
  buildSection(theatre.balconySeats, 'balcony', theatre.balconySeatPrice);
  buildSection(theatre.middleSeats,  'middle',  theatre.middleSeatPrice);
  buildSection(theatre.lowerSeats,   'lower',   theatre.lowerSeatPrice);
  return tickets;
};

const seedDatabase = async () => {
  try {
    // Ensure any existing duplicates from previous test runs or re-seeds are consolidated
    await deduplicateDatabaseMovies();

    const movieCount = await Movie.countDocuments();
    if (movieCount > 0) {
      console.log('ℹ️ Database already contains movies. Checking live TMDB synchronization...');
      try {
        const liveTmdb = await tmdbService.fetchNowPlayingFromTMDB(1);
        if (liveTmdb && liveTmdb.length > 0) {
          await tmdbService.syncTMDBMoviesToDatabase(liveTmdb.slice(0, 10), false);
          console.log(`✅ Synced ${Math.min(liveTmdb.length, 10)} real-time TMDB market movies!`);
        }
      } catch (syncErr) {
        console.warn('TMDB sync check warning:', syncErr.message);
      }
      // Re-verify deduplication after TMDB sync
      await deduplicateDatabaseMovies();
      return;
    }

    console.log('🌱 Seeding initial database with live TMDB market data and user accounts...');

    // 1. Create Default Users & Admins
    const userHashed = await bcrypt.hash('user123', 10);
    const adminHashed = await bcrypt.hash('admin123', 10);

    const testUser = await User.create({
      username: 'JohnDoe',
      email: 'user@imovies.com',
      password: userHashed
    });

    const testAdmin = await Admin.create({
      username: 'SuperAdmin',
      email: 'admin@imovies.com',
      password: adminHashed
    });

    // 2. Fetch Live Movies from TMDB or Fallback
    let moviesData = [];
    try {
      console.log('📡 Fetching live Now Playing movies from TMDB API...');
      const tmdbList = await tmdbService.fetchNowPlayingFromTMDB(1);
      if (Array.isArray(tmdbList) && tmdbList.length > 0) {
        for (const item of tmdbList.slice(0, 8)) {
          let details = null;
          try {
            details = await tmdbService.fetchMovieDetailsFromTMDB(item.id);
          } catch (e) {}
          moviesData.push(tmdbService.formatTMDBMovie(item, details));
        }
        console.log(`🎬 Successfully loaded ${moviesData.length} live movies from TMDB API!`);
      }
    } catch (tmdbErr) {
      console.warn('⚠️ Could not fetch from TMDB, using fallback dataset:', tmdbErr.message);
    }

    if (moviesData.length === 0) {
      moviesData = [
        {
          movieName: 'Oppenheimer',
          description: 'The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb during World War II.',
          genres: ['Biography', 'Drama', 'History'],
          releaseDate: new Date('2023-07-21'),
          language: 'English',
          duration: '3h 00m',
          certification: 'A',
          director: 'Christopher Nolan',
          cast: ['Cillian Murphy', 'Emily Blunt', 'Matt Damon', 'Robert Downey Jr.'],
          poster: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&auto=format&fit=crop&q=80',
          trailer: 'https://www.youtube.com/watch?v=uYPbbksJxIg',
        },
        {
          movieName: 'Dune: Part Two',
          description: 'Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family.',
          genres: ['Action', 'Adventure', 'Sci-Fi'],
          releaseDate: new Date('2024-03-01'),
          language: 'English',
          duration: '2h 46m',
          certification: 'U/A',
          director: 'Denis Villeneuve',
          cast: ['Timothée Chalamet', 'Zendaya', 'Rebecca Ferguson', 'Javier Bardem'],
          poster: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800&auto=format&fit=crop&q=80',
          trailer: 'https://www.youtube.com/watch?v=Way9Dexny3w',
        },
        {
          movieName: 'Interstellar',
          description: 'When Earth becomes uninhabitable in the future, a farmer and ex-NASA pilot, Joseph Cooper, is tasked to pilot a spacecraft along with a team of researchers.',
          genres: ['Adventure', 'Drama', 'Sci-Fi'],
          releaseDate: new Date('2014-11-07'),
          language: 'English',
          duration: '2h 49m',
          certification: 'U/A',
          director: 'Christopher Nolan',
          cast: ['Matthew McConaughey', 'Anne Hathaway', 'Jessica Chastain', 'Michael Caine'],
          poster: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=80',
          trailer: 'https://www.youtube.com/watch?v=zSWdZVtXT7E',
        },
      ];
    }

    const createdMovies = await Movie.insertMany(moviesData);

    // 3. Create Sample Theatres
    const theatresData = [
      {
        theatreName: 'PVR IMAX - Phoenix Palladium',
        theatreId: 'TH-' + uuidv4().substring(0, 8),
        location: 'Lower Parel, Mumbai',
        adminEmail: 'admin@imovies.com',
        balconySeatPrice: 450,
        middleSeatPrice: 320,
        lowerSeatPrice: 200,
        balconySeats: generateSeatLayout(2, 10),
        middleSeats: generateSeatLayout(4, 10),
        lowerSeats: generateSeatLayout(4, 10)
      },
      {
        theatreName: 'INOX Megaplex - Forum Mall',
        theatreId: 'TH-' + uuidv4().substring(0, 8),
        location: 'Koramangala, Bengaluru',
        adminEmail: 'admin@imovies.com',
        balconySeatPrice: 400,
        middleSeatPrice: 280,
        lowerSeatPrice: 180,
        balconySeats: generateSeatLayout(2, 10),
        middleSeats: generateSeatLayout(4, 10),
        lowerSeats: generateSeatLayout(4, 10)
      },
      {
        theatreName: 'Cinepolis VIP - DLF Avenue',
        theatreId: 'TH-' + uuidv4().substring(0, 8),
        location: 'Saket, New Delhi',
        adminEmail: 'admin@imovies.com',
        balconySeatPrice: 500,
        middleSeatPrice: 350,
        lowerSeatPrice: 220,
        balconySeats: generateSeatLayout(2, 10),
        middleSeats: generateSeatLayout(4, 10),
        lowerSeats: generateSeatLayout(4, 10)
      }
    ];

    const createdTheatres = await Theatre.insertMany(theatresData);

    // 4. Create Shows for Today, Tomorrow, and Next 3 Days
    const showTimes = ['10:30 AM', '02:00 PM', '06:15 PM', '09:45 PM'];
    const showsToInsert = [];

    for (let dayOffset = 0; dayOffset <= 4; dayOffset++) {
      const showDate = dayjs().add(dayOffset, 'day').format('YYYY-MM-DD');

      for (const movie of createdMovies) {
        for (const theatre of createdTheatres) {
          for (const time of showTimes.slice(0, 2)) {
            const initialTickets = buildInitialTickets(theatre);
            // Pre-book 2-3 seats for realism
            if (initialTickets['balcony_A1']) initialTickets['balcony_A1'] = { ...initialTickets['balcony_A1'], status: 'booked', bookedBy: 'sample@user.com' };
            if (initialTickets['balcony_A2']) initialTickets['balcony_A2'] = { ...initialTickets['balcony_A2'], status: 'booked', bookedBy: 'sample@user.com' };
            if (initialTickets['middle_C5'])  initialTickets['middle_C5']  = { ...initialTickets['middle_C5'],  status: 'booked', bookedBy: 'sample@user.com' };

            showsToInsert.push({
              showId: uuidv4(),
              movieId: movie._id.toString(),
              theatreId: theatre.theatreId,
              theatreName: theatre.theatreName,
              adminEmail: 'admin@imovies.com',
              showDate,
              showTime: time,
              tickets: initialTickets,
              isActive: true
            });
          }
        }
      }
    }

    await Show.insertMany(showsToInsert);

    // 5. Create Sample Reviews
    if (createdMovies.length > 0) {
      await Review.insertMany([
        {
          userEmail: 'user@imovies.com',
          movieId: createdMovies[0]._id.toString(),
          rating: 9,
          reviewText: 'An absolute cinematic masterpiece! Visuals and background score are breathtaking.'
        },
        {
          userEmail: 'cinemafan@imovies.com',
          movieId: createdMovies[0]._id.toString(),
          rating: 8,
          reviewText: 'Incredible performances and top-notch direction. Thoroughly enjoyed it on the big screen!'
        }
      ]);
    }

    console.log(`✅ Seed complete: ${createdMovies.length} TMDB market movies, ${createdTheatres.length} theatres, ${showsToInsert.length} shows!`);
    console.log(`👤 Default User:  user@imovies.com  / user123`);
    console.log(`🛡️ Default Admin: admin@imovies.com / admin123`);
  } catch (err) {
    console.error('❌ Seeding error:', err.message);
  }
};

module.exports = { seedDatabase };
