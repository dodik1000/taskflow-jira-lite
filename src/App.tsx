import { BrowserRouter, Route, Routes } from 'react-router-dom'
import LoginPage from './pages/LoginPage/LoginPage'
import BoardsPage from './pages/BoardsPage/BoardsPage'
import BoardPage from './pages/BoardPage/BoardPage'
import ProtectedRoute from './routes/ProtectedRoute'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path='/login' element={<LoginPage />} />

        <Route
          path='/'
          element={
            <ProtectedRoute>
              <BoardsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path='/board/:id'
          element={
            <ProtectedRoute>
              <BoardPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App
