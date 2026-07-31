import { createTheme } from "@mui/material/styles";

const theme = createTheme({
    palette: {
        mode: "dark",

        primary: {
            main: "#2563EB",
        },

        secondary: {
            main: "#10B981",
        },

        background: {
            default: "#0F172A",
            paper: "#1E293B",
        },

        text: {
            primary: "#FFFFFF",
            secondary: "#94A3B8",
        },
    },

    shape: {
        borderRadius: 14,
    },

    typography: {
        fontFamily: [
            "Inter",
            "Segoe UI",
            "Roboto",
            "Arial",
            "sans-serif",
        ].join(","),
    },
});

export default theme;