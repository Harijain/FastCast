import { useState } from "react";

import { FiEye, FiEyeOff } from "react-icons/fi";

const PasswordInput = ({

    value,

    onChange,

    placeholder,

    name

}) => {

    const [show, setShow] = useState(false);

    return (

        <div className="mb-5">

            <label

                className="block text-sm font-medium text-slate-700 mb-2"

            >

                Password

            </label>

            <div className="relative">

                <input

                    className="w-full rounded-xl border border-slate-300 px-4 py-3 pr-12 outline-none focus:border-blue-500 transition"

                    type={show ? "text" : "password"}

                    value={value}

                    name={name}

                    placeholder={placeholder}

                    onChange={onChange}

                />

                <button

                    type="button"

                    onClick={() => setShow(!show)}

                    className="absolute top-1/2 -translate-y-1/2 right-4 text-slate-500"

                >

                    {

                        show

                            ? <FiEyeOff size={18} />

                            : <FiEye size={18} />

                    }

                </button>

            </div>

        </div>

    );

};

export default PasswordInput;