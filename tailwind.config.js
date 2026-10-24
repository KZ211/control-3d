/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.js', './components/**/*.js'],
  theme: {
    extend: {
      colors: {
        papel: 'rgb(var(--papel) / <alpha-value>)',
        hoja: 'rgb(var(--hoja) / <alpha-value>)',
        tinta: 'rgb(var(--tinta) / <alpha-value>)',
        tenue: 'rgb(var(--tenue) / <alpha-value>)',
        linea: 'rgb(var(--linea) / <alpha-value>)',
        gana: 'rgb(var(--gana) / <alpha-value>)',
        pierde: 'rgb(var(--pierde) / <alpha-value>)',
        acento: 'rgb(var(--acento) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['var(--fuente)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
