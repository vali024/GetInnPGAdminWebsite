import Navbar from "./components/Navbar/Navbar";
import Sidebar from "./components/Sidebar/Sidebar";
import { Routes, Route, Navigate } from "react-router-dom";
import PropTypes from "prop-types";
import AddMember from "./pages/AddMember/AddMember";
import MembersList from "./pages/MembersList/MembersList";
import RentalData from "./pages/RentalData/RentalData";
import RoomManagement from "./pages/RoomManagement/RoomManagement";
import Login from "./pages/Login/Login";
import ProtectedRoute from "./components/ProtectedRoute";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const App = () => {
  const auth = JSON.parse(localStorage.getItem("adminAuth"));
  const AuthenticatedLayout = ({ children }) => (
    <>
      <Navbar />
      <hr />
      <div className="app-content">
        <Sidebar />
        {children}
      </div>
    </>
  );

  AuthenticatedLayout.propTypes = {
    children: PropTypes.node.isRequired,
  };

  return (
    <div>
      <ToastContainer />
      <Routes>
        <Route
          path="/login"
          element={
            auth?.isAuthenticated ? <Navigate to="/list" replace /> : <Login />
          }
        />
        <Route
          path="/"
          element={
            <Navigate to={auth?.isAuthenticated ? "/list" : "/login"} replace />
          }
        />

        <Route
          path="/addmember"
          element={
            <ProtectedRoute>
              <AuthenticatedLayout>
                <AddMember />
              </AuthenticatedLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/memberslist"
          element={
            <ProtectedRoute>
              <AuthenticatedLayout>
                <MembersList />
              </AuthenticatedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/rentaldata"
          element={
            <ProtectedRoute>
              <AuthenticatedLayout>
                <RentalData />
              </AuthenticatedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/rooms"
          element={
            <ProtectedRoute>
              <AuthenticatedLayout>
                <RoomManagement />
              </AuthenticatedLayout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  );
};

export default App;
