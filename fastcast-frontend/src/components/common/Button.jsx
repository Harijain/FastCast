import { motion } from "framer-motion";
import clsx from "clsx";

const Button = ({
    children,
    onClick,
    type = "button",
    variant = "primary",
    fullWidth = false,
    disabled = false,
    className = "",
}) => {

    const variants = {

        primary:
            "bg-gradient-to-r from-violet-600 to-cyan-500 text-white hover:opacity-95",

        secondary:
            "bg-white/10 border border-white/10 text-white hover:bg-white/20",

        ghost:
            "bg-transparent text-white hover:bg-white/10"

    };

    return (

        <motion.button

            whileHover={{ scale: 1.03 }}

            whileTap={{ scale: 0.97 }}

            transition={{ duration: 0.2 }}

            type={type}

            disabled={disabled}

            onClick={onClick}

            className={clsx(

                "px-6 py-3",

                "rounded-full",

                "font-semibold",

                "transition-all",

                "duration-300",

                "shadow-lg",

                "backdrop-blur-lg",

                "disabled:opacity-50",

                "disabled:cursor-not-allowed",

                fullWidth && "w-full",

                variants[variant],

                className

            )}

        >

            {children}

        </motion.button>

    );

};

export default Button;