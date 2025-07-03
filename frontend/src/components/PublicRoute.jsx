import { Navigate } from 'react-router-dom';

const PublicRoute = ({ children, user }) => {
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

export default PublicRoute;