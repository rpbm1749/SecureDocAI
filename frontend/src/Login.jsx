import { useState, useEffect } from 'react'
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import './App.css'
import Dashboard from './Dashboard';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

function Login({setContent}){
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showVerification, setShowVerification] = useState(false);
    const [verificationEmail, setVerificationEmail] = useState('');

    useEffect(() => {
        if (showVerification) {
            // Polling approach to check for email verification every 3 seconds
            const interval = setInterval(async () => {
                const user = auth.currentUser;
                if (user) {
                    await user.reload();
                    if (user.emailVerified) {
                        const token = await res.user.getIdToken();
                        localStorage.setItem("token", token);
                        localStorage.setItem("userId", res.user.uid);
                        alert("Email verified! Redirecting to Dashboard...");
                        setContent('dashboard');
                        clearInterval(interval);
                    }
                }
            }, 2000);
            
            return () => clearInterval(interval);
        }
    }, [showVerification, setContent]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        
        try {
            const res = await signInWithEmailAndPassword(auth, email, password);
            const token = await res.user.getIdToken();
            localStorage.setItem("token", token);
            localStorage.setItem("userId", res.user.uid);
            alert("Login successful");
            setContent('dashboard');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSignup = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        
        try {
            const res = await createUserWithEmailAndPassword(auth, email, password);
            
            // Send email verification
            await sendEmailVerification(res.user);
            
            alert("Signup successful! A verification email has been sent to " + email + ". Please check your email and click the verification link before logging in.");
            setEmail('');
            setPassword('');
            setVerificationEmail(res.user.email);
            setShowVerification(true);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const resendVerificationEmail = async () => {
        setLoading(true);
        setError('');
        try {
            const user = auth.currentUser;
            if (user) {
                await sendEmailVerification(user);
                alert("Verification email sent to " + user.email);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return(
        <div className='loginContain'>
            <div className='loginHeader'>
                <h1 className='text-4xl font-bold text-blue-600'>SecureDocAI</h1>
            </div>
            <div className='loginBody'>
                <div className='gap-6 loginForm'>

                    <h2 className='text-2xl font-bold text-grey-800 mb-4'>
                        {showVerification ? 'Verify Email' : 'Login'}
                    </h2>
                    
                    {showVerification ? (
                        <div className='flex flex-col items-center gap-4'>
                            <p className='text-gray-700 text-center'>
                                A verification email has been sent to <strong>{verificationEmail}</strong>
                            </p>
                            <p className='text-sm text-gray-600 text-center'>
                                Please click the link in your email to verify your account.
                            </p>
                            <button 
                                className="submit-button"
                                type="button"
                                onClick={resendVerificationEmail}
                                disabled={loading}
                            >
                                {loading ? 'Sending...' : 'Resend Email'}
                            </button>
                            <button 
                                className="signup-button"
                                type="button"
                                onClick={() => setShowVerification(false)}
                                disabled={loading}
                            >
                                Back to Login
                            </button>
                        </div>
                    ) : (
                        <form className='formBlock'>
                            <input 
                                className="formInput" 
                                type="email" 
                                placeholder="Email" 
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required 
                            />
                            <input 
                                className="formInput" 
                                type="password" 
                                placeholder="Password" 
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required 
                            />
                            {error && <p className='text-red-500 text-sm mt-2'>{error}</p>}
                            <div className='flex flex-row gap-3 justify-center w-full'>
                                <button 
                                    className="submit-button" 
                                    type="submit"
                                    onClick={handleLogin}
                                    disabled={loading}
                                >
                                    {loading ? 'Loading...' : 'Login'}
                                </button>
                                <button 
                                    className="signup-button" 
                                    type="button"
                                    onClick={handleSignup}
                                    disabled={loading}
                                >
                                    {loading ? 'Loading...' : 'Sign up'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Login;