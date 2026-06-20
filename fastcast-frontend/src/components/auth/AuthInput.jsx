const AuthInput = ({

    label,

    type = "text",

    value,

    onChange,

    placeholder,

    name

}) => {

    return (

        <div className="mb-5">

            <label

                className="block text-sm font-medium text-slate-700 mb-2"

            >

                {label}

            </label>

            <input

                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 transition"

                type={type}

                value={value}

                name={name}

                placeholder={placeholder}

                onChange={onChange}

            />

        </div>

    );

};

export default AuthInput;