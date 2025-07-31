import { Link } from "react-router-dom";

const Footer = () => {
    return (
        <footer className="bg-gradient-to-b from-purple-800/25 via-blue-950/20 to-bg-primary shadow-md text-white">
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