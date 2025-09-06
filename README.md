# 🍿 Poper - AI Movie Suggestions

[![React](https://img.shields.io/badge/React-19-blue?logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5-purple?logo=vite)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-cyan?logo=tailwindcss)](https://tailwindcss.com/)

Poper is a sleek, modern web application that provides personalized movie suggestions based on your mood or a scenario you describe. Using the power of Google's Gemini API and the OMDb database, Poper helps you discover the perfect movie to watch.

![Poper Screenshot](https://i.imgur.com/YOUR_SCREENSHOT_URL.png) 
*(Replace this with a screenshot of your application)*

---

## ✨ Features

- **AI-Powered Suggestions**: Describe your mood, a scenario, or what you're looking for in natural language (e.g., "a funny movie to watch with family" or "a mind-bending sci-fi thriller").
- **Advanced Filtering**: Narrow down your search by language, genre, and release year.
- **Detailed Movie Info**: Get key details for each suggested movie, including the poster, title, and year.
- **Direct IMDb Link**: Conveniently navigate to the movie's IMDb page for more information.
- **Responsive Design**: A beautiful and intuitive interface that works seamlessly on desktop and mobile devices.
- **Smart Fallback**: If AI suggestions don't yield results, the app performs a general search to ensure you always get recommendations.

---

## 🛠️ Tech Stack

- **Frontend**: [React](https://react.dev/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **AI**: [Google Gemini API](https://ai.google.dev/)
- **Movie Database**: [OMDb API](https://www.omdbapi.com/)

---

## 🚀 Getting Started

Follow these instructions to get a local copy of the project up and running.

### Prerequisites

- [Node.js](https://nodejs.org/en) (v18 or later recommended)
- [npm](https://www.npmjs.com/)
- API keys for both **Google Gemini** and **OMDb**.

### Installation

1.  **Clone the repository:**
    ```sh
    git clone https://github.com/your-username/poper-react.git
    cd poper-react
    ```

2.  **Install dependencies:**
    ```sh
    npm install
    ```

3.  **Set up environment variables:**
    Create a `.env.local` file in the root of your project and add your API keys:
    ```env
    VITE_GEMINI_API_KEY=your_gemini_api_key_here
    VITE_OMDB_API_KEY=your_omdb_api_key_here
    ```
    - Get your Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey).
    - Get your OMDb API key from [the OMDb website](https://www.omdbapi.com/apikey.aspx).

### Running the Application

- **Start the development server:**
  ```sh
  npm run dev
  ```
  The application will be available at `http://localhost:5173` (or another port if 5173 is in use).

---

## 📜 Available Scripts

In the project directory, you can run:

- `npm run dev`: Runs the app in development mode.
- `npm run build`: Builds the app for production to the `dist` folder.
- `npm run lint`: Lints the codebase using ESLint.
- `npm run preview`: Serves the production build locally for preview.

---

## 🤝 Contributing

Contributions are welcome! If you have suggestions for improvements or want to fix a bug, please feel free to open an issue or submit a pull request.

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License. See the `LICENSE` file for more details.

---

## 🙏 Acknowledgements

- Icons and UI inspiration from various modern web designs.
- Powered by the incredible APIs from [Google](https://ai.google.dev/) and [OMDb](https://www.omdbapi.com/).
