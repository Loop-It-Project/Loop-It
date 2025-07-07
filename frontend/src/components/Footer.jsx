import { Link } from "react-router-dom";

const Footer = () => {
    return (
        <footer className="bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 shadow-md text-white">
        <div className="flex flex-col mx-auto text-center">
            <Link to="/imprint" className="text-sm hover:opacity-80 transition-opacity">Impressum</Link>
            <Link to="/privacypolicy" className="text-sm hover:opacity-80 transition-opacity">Datenschutz</Link>
            <p className="text-sm">
            &copy; {new Date().getFullYear()} Loop-It. All rights reserved.
            </p>
        </div>
        </footer>
    );
}

export default Footer;