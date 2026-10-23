/**
 * seedData.js
 * Automatically populates sample movies, theatres, shows, admins, and users.
 */

import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import User from './models/userModel.js';
import Admin from './models/adminModel.js';
import Movie from './models/movieModel.js';
import Theatre from './models/theatreModel.js';
import Show from './models/showModel.js';
import Review from './models/reviewModel.js';

const buildTickets = (totalSeats = 70) => {
  const tickets = {};
  const tiers = [
    { prefix: 'B', count: 20 },
    { prefix: 'M', count: 30 },
    { prefix: 'L', count: 20 },
  ];

  tiers.forEach(({ prefix, count }) => {
    const rows = Math.ceil(count / 10);
    for (let r = 0; r < rows; r++) {
      const rowChar = String.fromCharCode(65 + r);
      const cols = Math.min(10, count - r * 10);
      for (let c = 1; c <= cols; c++) {
        const id = `${prefix}-${rowChar}${c}`;
        tickets[id] = {
          status: 'available',
          lockedBy: null,
          lockExpiry: null,
          bookedBy: null,
        };
      }
    }
  });

  return tickets;
};

export const seedDatabase = async () => {
  try {
    const movieCount = await Movie.countDocuments();
    if (movieCount > 0) {
      console.log(`[Seed] Database already contains ${movieCount} movies. Skipping seeding.`);
      return;
    }

    console.log('[Seed] Seeding sample data for iMovies...');

    // 1. Create Admins
    const adminPasswordHash = await bcrypt.hash('admin123', 10);
    const admin = await Admin.create({
      username: 'superadmin',
      email: 'admin@imovies.com',
      password: adminPasswordHash,
      isSuperAdmin: true,
    });

    // 2. Create Sample User
    const userPasswordHash = await bcrypt.hash('user123', 10);
    const user = await User.create({
      username: 'john_doe',
      email: 'john@imovies.com',
      password: userPasswordHash,
    });

    // 3. Create Theatres
    const theatres = await Theatre.create([
      {
        theatreId: uuidv4(),
        theatreName: 'PVR IMAX & Gold Class',
        location: 'Connaught Place, New Delhi',
        address: 'Plaza Cinema Building, H Block, CP',
        balconySeatPrice: 450,
        middleSeatPrice: 320,
        lowerSeatPrice: 180,
        balconySeats: { rows: 2, cols: 10, total: 20 },
        middleSeats: { rows: 3, cols: 10, total: 30 },
        lowerSeats: { rows: 2, cols: 10, total: 20 },
        adminEmail: 'admin@imovies.com',
        isActive: true,
      },
      {
        theatreId: uuidv4(),
        theatreName: 'INOX Megaplex',
        location: 'Bandra West, Mumbai',
        address: 'Linking Road, Bandra West',
        balconySeatPrice: 400,
        middleSeatPrice: 280,
        lowerSeatPrice: 160,
        balconySeats: { rows: 2, cols: 10, total: 20 },
        middleSeats: { rows: 3, cols: 10, total: 30 },
        lowerSeats: { rows: 2, cols: 10, total: 20 },
        adminEmail: 'admin@imovies.com',
        isActive: true,
      },
      {
        theatreId: uuidv4(),
        theatreName: 'Cinepolis Dolby Atmos Multiplex',
        location: 'Koramangala, Bangalore',
        address: 'Forum Mall, Hosur Road',
        balconySeatPrice: 380,
        middleSeatPrice: 260,
        lowerSeatPrice: 150,
        balconySeats: { rows: 2, cols: 10, total: 20 },
        middleSeats: { rows: 3, cols: 10, total: 30 },
        lowerSeats: { rows: 2, cols: 10, total: 20 },
        adminEmail: 'admin@imovies.com',
        isActive: true,
      },
    ]);

    // 4. Create Movies
    const movies = await Movie.create([
      {
        movieName: 'Oppenheimer',
        description:
          'The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb during World War II. A breathtaking cinematic masterpiece directed by Christopher Nolan.',
        genres: ['Drama', 'Biography', 'History'],
        releaseDate: new Date('2023-07-21'),
        language: 'English',
        duration: '3h 00m',
        certification: 'A',
        posterUrl:
          'https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?auto=format&fit=crop&w=800&q=80',
        trailerUrl: 'https://www.youtube.com/watch?v=uYPbbksJxIg',
        director: 'Christopher Nolan',
        cast: ['Cillian Murphy', 'Emily Blunt', 'Matt Damon', 'Robert Downey Jr.'],
        isActive: true,
      },
      {
        movieName: 'Dune: Part Two',
        description:
          'Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family. Facing a choice between the love of his life and the fate of the universe.',
        genres: ['Sci-Fi', 'Adventure', 'Action'],
        releaseDate: new Date('2024-03-01'),
        language: 'English',
        duration: '2h 46m',
        certification: 'UA',
        posterUrl:
          'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=800&q=80',
        trailerUrl: 'https://www.youtube.com/watch?v=Way9Dexny3w',
        director: 'Denis Villeneuve',
        cast: ['Timothée Chalamet', 'Zendaya', 'Rebecca Ferguson', 'Javier Bardem'],
        isActive: true,
      },
      {
        movieName: 'Interstellar',
        description:
          'When Earth becomes uninhabitable in the future, a farmer and ex-NASA pilot, Joseph Cooper, is tasked to pilot a spacecraft along with a team of researchers to find a new planet for humans.',
        genres: ['Sci-Fi', 'Drama', 'Adventure'],
        releaseDate: new Date('2014-11-07'),
        language: 'English',
        duration: '2h 49m',
        certification: 'UA',
        posterUrl:
          'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80',
        trailerUrl: 'https://www.youtube.com/watch?v=zSWdZVtXT7E',
        director: 'Christopher Nolan',
        cast: ['Matthew McConaughey', 'Anne Hathaway', 'Jessica Chastain', 'Michael Caine'],
        isActive: true,
      },
      {
        movieName: 'Inception',
        description:
          'A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.',
        genres: ['Action', 'Sci-Fi', 'Thriller'],
        releaseDate: new Date('2010-07-16'),
        language: 'English',
        duration: '2h 28m',
        certification: 'UA',
        posterUrl:
          'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80',
        trailerUrl: 'https://www.youtube.com/watch?v=YoHD9XEInc0',
        director: 'Christopher Nolan',
        cast: ['Leonardo DiCaprio', 'Joseph Gordon-Levitt', 'Elliot Page', 'Tom Hardy'],
        isActive: true,
      },
      {
        movieName: 'Spider-Man: Across the Spider-Verse',
        description:
          'Miles Morales catapults across the Multiverse, where he encounters a team of Spider-People charged with protecting its very existence.',
        genres: ['Animation', 'Action', 'Adventure'],
        releaseDate: new Date('2023-06-02'),
        language: 'English',
        duration: '2h 20m',
        certification: 'U',
        posterUrl:
          'https://images.unsplash.com/photo-1635805737707-575885ab0820?auto=format&fit=crop&w=800&q=80',
        trailerUrl: 'https://www.youtube.com/watch?v=cqGjhVJWtEg',
        director: 'Joaquim Dos Santos, Kemp Powers',
        cast: ['Shameik Moore', 'Hailee Steinfeld', 'Oscar Isaac', 'Daniel Kaluuya'],
        isActive: true,
      },
      {
        movieName: 'The Dark Knight',
        description:
          'When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.',
        genres: ['Action', 'Crime', 'Drama'],
        releaseDate: new Date('2008-07-18'),
        language: 'English',
        duration: '2h 32m',
        certification: 'UA',
        posterUrl:
          'https://images.unsplash.com/photo-1509281373149-e957c6296406?auto=format&fit=crop&w=800&q=80',
        trailerUrl: 'https://www.youtube.com/watch?v=EXeTwQWrcwY',
        director: 'Christopher Nolan',
        cast: ['Christian Bale', 'Heath Ledger', 'Aaron Eckhart', 'Gary Oldman'],
        isActive: true,
      },
    ]);

    // 5. Schedule Shows for Today, Tomorrow, and Day After across theatres
    const formatDate = (daysAhead) => {
      const d = new Date();
      d.setDate(d.getDate() + daysAhead);
      return d.toISOString().split('T')[0];
    };

    const today = formatDate(0);
    const tomorrow = formatDate(1);
    const dayAfter = formatDate(2);

    const showTimes = ['10:00 AM', '01:30 PM', '05:00 PM', '08:30 PM'];

    const showsToInsert = [];

    movies.forEach((movie, mIdx) => {
      theatres.forEach((theatre, tIdx) => {
        // Schedule a show for each movie at least in one theatre
        if ((mIdx + tIdx) % 2 === 0) {
          [today, tomorrow, dayAfter].forEach((dateStr, dIdx) => {
            const time = showTimes[(mIdx + dIdx) % showTimes.length];
            const tMap = buildTickets(70);

            // Pre-book 2 seats just to demonstrate booked status
            tMap['B-A1'].status = 'booked';
            tMap['B-A1'].bookedBy = 'john@imovies.com';
            tMap['M-C5'].status = 'booked';
            tMap['M-C5'].bookedBy = 'john@imovies.com';

            showsToInsert.push({
              showId: uuidv4(),
              adminEmail: 'admin@imovies.com',
              movieId: movie._id.toString(),
              theatreName: theatre.theatreName,
              theatreId: theatre.theatreId,
              showDate: new Date(dateStr),
              showTime: time,
              tickets: tMap,
              totalSeats: 70,
              availableSeats: 68,
              status: 'upcoming',
            });
          });
        }
      });
    });

    await Show.insertMany(showsToInsert);

    // 6. Add Reviews
    await Review.create([
      {
        userEmail: 'john@imovies.com',
        username: 'john_doe',
        movieId: movies[0]._id.toString(),
        rating: 5,
        reviewText:
          'Absolute masterpiece of modern filmmaking. The sound design and Cillian Murphys performance are Oscar-worthy. Best experienced on IMAX!',
      },
      {
        userEmail: 'john@imovies.com',
        username: 'john_doe',
        movieId: movies[1]._id.toString(),
        rating: 5,
        reviewText:
          'The visual scale of Dune 2 is unmatched. Hans Zimmers score elevates every single scene to pure epicness.',
      },
    ]);

    console.log(`[Seed] ✅ Database seeded successfully:`);
    console.log(`  - 1 Super Admin (admin@imovies.com / admin123)`);
    console.log(`  - 1 Customer User (john@imovies.com / user123)`);
    console.log(`  - ${movies.length} Movies`);
    console.log(`  - ${theatres.length} Theatres`);
    console.log(`  - ${showsToInsert.length} Scheduled Shows`);
    console.log(`  - 2 Reviews`);
  } catch (err) {
    console.error('[Seed] Error seeding data:', err);
  }
};

export default { seedDatabase };
