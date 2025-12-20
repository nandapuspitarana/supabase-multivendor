import React, { useState } from "react";
import signupimage from '../../images/signup-g.svg'
import { Link } from "react-router-dom";
import ScrollToTop from "../ScrollToTop";

import { supabase } from '../../lib/supabaseClient'

const MyAccountSignUp = () => {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)
    const full_name = `${firstName} ${lastName}`.trim()
    const { data, error: signErr } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name } }
    })
    if (signErr) {
      setError(signErr.message)
      setLoading(false)
      return
    }
    const userId = data.user?.id
    if (userId) {
      const { error: insErr } = await supabase
        .from('customers')
        .insert({ mode: 'active', auth_user_id: userId, full_name, email, phone, address })
      if (insErr) {
        setError(insErr.message)
        setLoading(false)
        return
      }
    }
    setSuccess('Registration successful. Please check your email to confirm.')
    setLoading(false)
  }
  return (
    <div>
       <>
            <ScrollToTop/>
            </>
      <>
        {/* section */}
        <section className="my-lg-14 my-8">
          {/* container */}
          <div className="container">
            {/* row */}
            <div className="row justify-content-center align-items-center">
              <div className="col-12 col-md-6 col-lg-4 order-lg-1 order-2">
                {/* img */}
                <img
                  src={signupimage}
                  alt="freshcart"
                  className="img-fluid"
                />
              </div>
              {/* col */}
              <div className="col-12 col-md-6 offset-lg-1 col-lg-4 order-lg-2 order-1">
                <div className="mb-lg-9 mb-5">
                  <h1 className="mb-1 h2 fw-bold">Get Start Shopping</h1>
                  <p>Welcome to FreshCart! Enter your email to get started.</p>
                </div>
                {/* form */}
                <form onSubmit={onSubmit}>
                  <div className="row g-3">
                    {/* col */}
                    <div className="col">
                      {/* input */}
                      <input
                        type="text"
                        className="form-control"
                        placeholder="First name"
                        aria-label="First name"
                        required
                        value={firstName}
                        onChange={(e)=>setFirstName(e.target.value)}
                      />
                    </div>
                    <div className="col">
                      {/* input */}
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Last name"
                        aria-label="Last name"
                        required
                        value={lastName}
                        onChange={(e)=>setLastName(e.target.value)}
                      />
                    </div>
                    <div className="col-12">
                      {/* input */}
                      <input
                        type="email"
                        className="form-control"
                        id="inputEmail4"
                        placeholder="Email"
                        required
                        value={email}
                        onChange={(e)=>setEmail(e.target.value)}
                      />
                    </div>
                    <div className="col-12">
                      {/* input */}
                      <input
                        type="password"
                        className="form-control"
                        id="inputPassword4"
                        placeholder="Password"
                        required
                        value={password}
                        onChange={(e)=>setPassword(e.target.value)}
                      />
                    </div>
                    <div className="col-12">
                      <input
                        type="tel"
                        className="form-control"
                        placeholder="Phone"
                        required
                        value={phone}
                        onChange={(e)=>setPhone(e.target.value)}
                      />
                    </div>
                    <div className="col-12">
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Address"
                        required
                        value={address}
                        onChange={(e)=>setAddress(e.target.value)}
                      />
                    </div>
                    {/* btn */}
                    <div className="col-12 d-grid">
                      {" "}
                      <button type="submit" className="btn btn-primary" disabled={loading}>
                        Register
                      </button>
                      {error ? <div className="text-danger mt-2">{error}</div> : null}
                      {success ? <div className="text-success mt-2">{success}</div> : null}
                      <span className="navbar-text">
                          Already have an account?{" "}

                          <Link to="/MyAccountSignIn">Sign in</Link>
                        </span>
                    </div>
                    {/* text */}
                    <p>
                      <small>
                        By continuing, you agree to our{" "}
                        <Link to="#!"> Terms of Service</Link> &amp;{" "}
                        <Link to="#!">Privacy Policy</Link>
                      </small>
                    </p>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </section>
      </>
    </div>
  );
};

export default MyAccountSignUp;
