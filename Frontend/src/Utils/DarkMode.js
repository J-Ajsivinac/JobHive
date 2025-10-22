export const isDarkMode = () => {
    const darkMode = window.matchMedia('(prefers-color-scheme: dark)');
    return darkMode.matches;
};