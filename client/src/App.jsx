import React, { Suspense, lazy } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import Loader from './components/Loader'
import UserProtection from './utils/UserProtection'
import AdminProtection from './utils/AdminProtection'
import { ThemeProvider, useTheme } from './context/ThemeContext'

// ─── Lazy-loaded User Pages ───────────────────────────────────────────────────
const LandingPage      = lazy(() => import('./pages/LandingPage'))
const LoginPage        = lazy(() => import('./pages/LoginPage'))
const RegisterPage     = lazy(() => import('./pages/RegisterPage'))
const HomePage         = lazy(() => import('./pages/HomePage'))
const MovieDetailsPage = lazy(() => import('./pages/MovieDetailsPage'))
const MovieShowsPage   = lazy(() => import('./pages/MovieShowsPage'))
const SeatSlugPage     = lazy(() => import('./pages/SeatSlugPage'))
const BookingsPage     = lazy(() => import('./pages/BookingsPage'))
const FavoriteShowsPage = lazy(() => import('./pages/FavoriteShowsPage'))
const ProfilePage      = lazy(() => import('./pages/ProfilePage'))

// ─── Lazy-loaded Admin Pages ──────────────────────────────────────────────────
const AdminDashboard       = lazy(() => import('./pages/admin/AdminDashboard'))
const AddMoviePage         = lazy(() => import('./pages/admin/AddMoviePage'))
const AddTheatrePage       = lazy(() => import('./pages/admin/AddTheatrePage'))
const AddShowPage          = lazy(() => import('./pages/admin/AddShowPage'))
const AddAdminPage         = lazy(() => import('./pages/admin/AddAdminPage'))
const AdminBookingsPage     = lazy(() => import('./pages/admin/AdminBookingsPage'))
const AdminTransactionsPage = lazy(() => import('./pages/admin/AdminTransactionsPage'))

function AppContent() {
  const { isDark } = useTheme();

  return (
    <Router>
      {/* Global toast notifications adapt to active theme */}
      <ToastContainer
        position="top-right"
        theme={isDark ? 'dark' : 'light'}
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />

      {/* Suspense wraps all lazy-loaded routes */}
      <Suspense fallback={<Loader />}>
        <Routes>
          {/* ── Public routes ────────────────────────────────────────────── */}
          <Route path="/"            element={<Navigate to="/landing" replace />} />
          <Route path="/landing"     element={<LandingPage />} />
          <Route path="/login"       element={<LoginPage />} />
          <Route path="/admin-login" element={<LoginPage adminMode={true} />} />
          <Route path="/register"    element={<RegisterPage />} />

          {/* ── User-protected routes ─────────────────────────────────────── */}
          <Route element={<UserProtection />}>
            <Route path="/home"                  element={<HomePage />} />
            <Route path="/moviedetails/:movieId" element={<MovieDetailsPage />} />
            <Route path="/movie/:movieId"        element={<MovieDetailsPage />} />
            <Route path="/movieshows/:movieId"   element={<MovieShowsPage />} />
            <Route path="/seatslug/:showId"      element={<SeatSlugPage />} />
            <Route path="/bookings"              element={<BookingsPage />} />
            <Route path="/favoriteshows"         element={<FavoriteShowsPage />} />
            <Route path="/profile"               element={<ProfilePage />} />
          </Route>

          {/* ── Admin-protected routes ────────────────────────────────────── */}
          <Route element={<AdminProtection />}>
            <Route path="/admin"               element={<AdminDashboard />} />
            <Route path="/addmovie"            element={<AddMoviePage />} />
            <Route path="/addtheatre"          element={<AddTheatrePage />} />
            <Route path="/addshow"             element={<AddShowPage />} />
            <Route path="/addadmin"            element={<AddAdminPage />} />
            <Route path="/adminbookings"       element={<AdminBookingsPage />} />
            <Route path="/admin/transactions"  element={<AdminTransactionsPage />} />
          </Route>

          {/* ── 404 fallback ──────────────────────────────────────────────── */}
          <Route path="*" element={<Navigate to="/landing" replace />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;
