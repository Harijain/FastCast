import { useState } from "react";
import { useNavigate } from "react-router-dom";

import AuthLayout from "../../components/auth/AuthLayout";
import AuthInput from "../../components/auth/AuthInput";
import PasswordInput from "../../components/auth/PasswordInput";
import Button from "../../components/common/Button";

import useAuthStore from "../../store/authStore";

const RegisterPage = () => {

    const navigate = useNavigate();

    const register = useAuthStore((state) => state.register);

    const loading = useAuthStore((state) => state.loading);

    const [form, setForm] = useState({

        name: "",

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

        const name = form.name.trim();
        const email = form.email.trim();
        const password = form.password;

        if (!name || !email || !password) {

            setError("Please fill all fields.");

            return;

        }

        if (password.length < 6) {

            setError("Password must be at least 6 characters.");

            return;

        }

        try {

            await register({

                name,

                email,

                password

            });

            navigate("/");

        }

        catch (err) {

            setError(

                err.response?.data?.message ||

                "Registration failed."

            );

        }

    };

    return (

        <AuthLayout

            title="Create Account"

            subtitle="Join FastCast today"

            footerText="Already have an account?"

            footerLabel="Login"

            footerLink="/login"

        >

            <form
                onSubmit={handleSubmit}
                className="space-y-2"
            >

                <AuthInput

                    label="Full Name"

                    name="name"

                    placeholder="Hari Jain"

                    value={form.name}

                    onChange={handleChange}

                />

                <AuthInput

                    label="Email"

                    name="email"

                    placeholder="hari@example.com"

                    value={form.email}

                    onChange={handleChange}

                />

                <PasswordInput

                    name="password"

                    placeholder="Create password"

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

                            ? "Creating Account..."

                            : "Create Account"

                    }

                </Button>

            </form>

        </AuthLayout>

    );

};

export default RegisterPage;