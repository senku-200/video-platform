'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { authService } from '@/services/auth';
import { useAuth } from '@/contexts/AuthContext';

export default function Login() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setAuth } = useAuth();
  const [formData, setFormData] = useState({
    userId: '',
    userPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authService.login(formData);
      const user = authService.getCurrentUser();
      setAuth(user, response.token);
      
      // Redirect to the original requested page or home
      const redirectTo = searchParams.get('from') || '/';
      router.push(redirectTo);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="container">
      <div className="row justify-content-center">
        <div className="col-md-6 col-lg-4">
          <div className="card mt-5">
            <div className="card-body">
              <h2 className="text-center mb-4">Login</h2>
              
              {error && (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit}>
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
                  ) : 'Login'}
                </button>
              </form>

              <div className="text-center mt-3">
                <p>Don't have an account? <Link href="/register">Register here</Link></p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 