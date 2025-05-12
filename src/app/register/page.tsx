'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authService } from '@/services/auth';
import { useAuth } from '@/contexts/AuthContext';

export default function Register() {
  const router = useRouter();
  const { setAuth } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    userId: '',
    userEmail: '',
    userPassword: '',
    confirmPassword: '',
    userRole: false
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.userPassword !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const response = await authService.register(formData);
      if (response.token) {
        const user = {
          userId: formData.userId,
          username: formData.username,
          userEmail: formData.userEmail,
          userRole: formData.userRole
        };
        setAuth(user, response.token);
      }
      router.push('/login');
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  return (
    <div className="container">
      <div className="row justify-content-center">
        <div className="col-md-6 col-lg-4">
          <div className="card mt-5">
            <div className="card-body">
              <h2 className="text-center mb-4">Register</h2>
              
              {error && (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="username" className="form-label">Full Name</label>
                  <input
                    type="text"
                    className="form-control"
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="userId" className="form-label">User ID</label>
                  <input
                    type="text"
                    className="form-control"
                    id="userId"
                    name="userId"
                    value={formData.userId}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="userEmail" className="form-label">Email address</label>
                  <input
                    type="email"
                    className="form-control"
                    id="userEmail"
                    name="userEmail"
                    value={formData.userEmail}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="userPassword" className="form-label">Password</label>
                  <input
                    type="password"
                    className="form-control"
                    id="userPassword"
                    name="userPassword"
                    value={formData.userPassword}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
                  <input
                    type="password"
                    className="form-control"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="mb-3 form-check">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="userRole"
                    name="userRole"
                    checked={formData.userRole}
                    onChange={handleChange}
                  />
                  <label className="form-check-label" htmlFor="userRole">
                    Register as Content Creator
                  </label>
                </div>

                <button 
                  type="submit" 
                  className="btn btn-primary w-100"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Loading...
                    </>
                  ) : 'Register'}
                </button>
              </form>

              <div className="text-center mt-3">
                <p>Already have an account? <Link href="/login">Login here</Link></p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 