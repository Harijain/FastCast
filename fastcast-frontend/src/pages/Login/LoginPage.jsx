import { useState } from "react";
import { useNavigate } from "react-router-dom";

import AuthLayout from "../../components/auth/AuthLayout";
import AuthInput from "../../components/auth/AuthInput";
import PasswordInput from "../../components/auth/PasswordInput";
import Button from "../../components/common/Button";

import useAuthStore from "../../store/authStore";

const LoginPage = () => {

    const navigate = useNavigate();

    const login = useAuthStore((state) => state.login);

    const loading = useAuthStore((state) => state.loading);

    const [form, setForm] = useState({

        email: "",

        password: ""

    });

    const [error, setError] = useState("");

    const handleChange = (e) => {

        setForm({

            ...form,

            [e.target.name]: e.target.value

        });

    };

    const handleSubmit = async (e) => {

        e.preventDefault();

        setError("");

        const email = form.email.trim();

        const password = form.password;

        if (!email || !password) {

            setError("Please enter email and password.");

            return;

        }

        try {

            await login({

                email,

                password

            });

            navigate("/");

        }

        catch (err) {

            setError(

                err.response?.data?.message ||

                "Invalid email or password."

            );

        }

    };

    return (

        <AuthLayout

            title="Welcome Back"

            subtitle="Sign in to FastCast"

            footerText="Don't have an account?"

            footerLabel="Register"

            footerLink="/register"

        >

            <form
                onSubmit={handleSubmit}
                className="space-y-2"
            >

                <AuthInput

                    label="Email"

                    name="email"

                    placeholder="test@fastcast.com"

                    value={form.email}

                    onChange={handleChange}

                />

                <PasswordInput

                    name="password"

                    placeholder="Enter password"

                    value={form.password}

                    onChange={handleChange}

                />

                {

                    error &&

                    <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">

                        {error}

                    </div>

                }

                <Button

                    type="submit"

                    fullWidth

                    disabled={loading}

                >

                    {

                        loading

                            ? "Signing In..."

                            : "Sign In"

                    }

                </Button>

            </form>

        </AuthLayout>

    );

};

export default LoginPage;