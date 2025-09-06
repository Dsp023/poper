import { useState, useEffect } from 'react';
import './index.css'; // We'll create this for the animations

function App() {
    // --- State Management ---
    // Using React's useState hook to manage component state.
    const [userInput, setUserInput] = useState('');
    const [filters, setFilters] = useState({ language: 'all', genre: 'all', year: 'all' });
    const [movies, setMovies] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // --- API Configuration ---
    // Securely access environment variables.
    // These keys must be in a .env.local file at the project root.
    const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
    const OMDB_API_KEY = import.meta.env.VITE_OMDB_API_KEY;
    const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    const OMDB_API_URL = `https://www.omdbapi.com/?apikey=${OMDB_API_KEY}`;
    
    // Check for API keys on component mount
    useEffect(() => {
        if (!GEMINI_API_KEY || !OMDB_API_KEY) {
            setError('Configuration Error: API keys are missing. Please create a .env.local file and add your VITE_GEMINI_API_KEY and VITE_OMDB_API_KEY.');
        }
    }, [GEMINI_API_KEY, OMDB_API_KEY]);

    // --- Core Logic ---
    // Main function to handle the entire movie suggestion process.
    const handleMovieSuggestion = async (e) => {
        e.preventDefault();

        if (!userInput.trim()) {
            setError('Please describe your movie mood or scenario.');
            return;
        }

        setIsLoading(true);
        setError(null);
        setMovies([]);

        try {
            // Step 1: Get movie titles from the Gemini API.
            const suggestedTitles = await getAiSuggestions(userInput, filters);

            // Step 2: Fetch detailed movie data from OMDb.
            const fetchedMovies = await searchMoviesWithOMDb(suggestedTitles, userInput, filters);
            
            if (fetchedMovies.length > 0) {
                setMovies(fetchedMovies);
            } else {
                 setError("Couldn't find any movies matching your request. Please try a different description.");
            }

        } catch (err) {
            console.error('Error in movie suggestion process:', err);
            setError(err.message || 'An unknown error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    // --- Helper Functions ---

    // Fetches suggestions from the Gemini AI model.
    const getAiSuggestions = async (userInput, filters) => {
        if (!GEMINI_API_KEY) {
            throw new Error('Gemini API key is missing. Please check your environment variables.');
        }

        const prompt = `
            Based on this request: "${userInput}", suggest 5-8 well-known movie titles that:
            - Match the specified language: ${filters.language}
            - Match the specified genre: ${filters.genre}
            - Match the specified year/period: ${filters.year}
            - Are popular and widely available
            - Have had theatrical or major streaming releases
            
            IMPORTANT: Return ONLY a comma-separated list of exact movie titles, no explanations.
            Example: The Dark Knight, Inception, The Matrix, Pulp Fiction
        `;

        const response = await fetch(GEMINI_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { maxOutputTokens: 150, temperature: 0.4 }
            })
        });

        if (!response.ok) throw new Error('Failed to get suggestions from the AI service.');
        
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (!text) throw new Error('The AI returned an empty response. Please try again.');
        
        return text.split(',').map(t => t.trim()).filter(Boolean);
    };
    
    // Searches OMDb for the suggested titles.
    const searchMoviesWithOMDb = async (titles, userInput, filters) => {
        const seenMovies = new Set();
        let results = [];

        try {
            // Validate API key
            if (!OMDB_API_KEY) {
                throw new Error('OMDB API key is missing. Please check your environment variables.');
            }

            // Process movies one at a time to handle errors gracefully
            for (const title of titles) {
                try {
                    const response = await fetch(`https://www.omdbapi.com/?apikey=${OMDB_API_KEY}&t=${encodeURIComponent(title)}`);
                    if (!response.ok) {
                        console.error(`Failed to fetch movie ${title}:`, response.status);
                        continue;
                    }
                    const data = await response.json();
                    if (data.Response === 'True' && !seenMovies.has(data.imdbID)) {
                        seenMovies.add(data.imdbID);
                        results.push(data);
                    }
                } catch (error) {
                    console.error(`Error fetching movie ${title}:`, error);
                    continue;
                }
            }

            // If no results found, try fallback search
            if (results.length === 0) {
                console.log("No exact matches found, trying fallback search...");
                const fallbackResponse = await fetch(`https://www.omdbapi.com/?apikey=${OMDB_API_KEY}&s=${encodeURIComponent(userInput)}&type=movie`);
                if (fallbackResponse.ok) {
                    const fallbackData = await fallbackResponse.json();
                    if (fallbackData.Response === 'True' && fallbackData.Search) {
                        // Get full details for each movie found
                        for (const movie of fallbackData.Search) {
                            if (seenMovies.has(movie.imdbID)) continue;
                            try {
                                const detailResponse = await fetch(`https://www.omdbapi.com/?apikey=${OMDB_API_KEY}&i=${movie.imdbID}`);
                                if (detailResponse.ok) {
                                    const detailData = await detailResponse.json();
                                    if (detailData.Response === 'True') {
                                        seenMovies.add(detailData.imdbID);
                                        results.push(detailData);
                                    }
                                }
                            } catch (error) {
                                console.error(`Error fetching movie details:`, error);
                            }
                        }
                    }
                }
            }

            return filterMoviesByYear(results.filter(movie => movie.Poster !== 'N/A'), filters.year);

        } catch (error) {
            console.error('Error in searchMoviesWithOMDb:', error);
            throw new Error('Failed to search for movies. Please try again later.');
        }
        let validMovies = [];

        results.forEach(movie => {
            if (movie.Response === 'True' && movie.Poster !== 'N/A' && !seenMovies.has(movie.imdbID)) {
                seenMovies.add(movie.imdbID);
                validMovies.push(movie);
            }
        });
        
        // --- Fallback Logic ---
        // If AI suggestions yield no results, try a general search.
        if (validMovies.length === 0) {
            console.warn("AI suggestions failed. Trying fallback search.");
            const fallbackRes = await fetch(`${OMDB_API_URL}&s=${encodeURIComponent(userInput)}`);
            const fallbackData = await fallbackRes.json();
            if (fallbackData.Response === 'True') {
                 validMovies = fallbackData.Search.filter(m => m.Poster !== 'N/A');
            }
        }
        
        return filterMoviesByYear(validMovies, filters.year);
    };

    // Filters movies based on the selected year range.
    const filterMoviesByYear = (movies, yearFilter) => {
        if (yearFilter === 'all') return movies;
        return movies.filter(movie => {
            const movieYear = parseInt(movie.Year);
            if (isNaN(movieYear)) return false;
            
            switch (yearFilter) {
                case '2025': return movieYear === 2025;
                case '2024': return movieYear === 2024;
                case '2023': return movieYear === 2023;
                case '2022': return movieYear === 2022;
                case '2021': return movieYear === 2021;
                case '2020': return movieYear === 2020;
                case '2010s': return movieYear >= 2010 && movieYear <= 2019;
                case '2000s': return movieYear >= 2000 && movieYear <= 2009;
                case '1990s': return movieYear >= 1990 && movieYear <= 1999;
                case '1980s': return movieYear >= 1980 && movieYear <= 1989;
                case 'classic': return movieYear < 1980;
                default: return true;
            }
        });
    };

    const handleFilterChange = (e) => {
        const { id, value } = e.target;
        setFilters(prev => ({ ...prev, [id.replace('Filter', '')]: value }));
    };

    // --- JSX Rendering ---
    return (
        <div className="bg-black min-h-screen text-white font-sans">
            <header className="text-center py-16 animate-fadeIn">
                <h1 className="text-6xl font-light text-white mb-4">poper</h1>
                <p className="text-gray-400 text-lg">movie suggestions</p>
            </header>

            <main className="container mx-auto px-8 max-w-6xl">
                <form onSubmit={handleMovieSuggestion} className="mb-12 animate-fadeInUp">
                    <div className="flex flex-col gap-4">
                        <input
                            type="text"
                            value={userInput}
                            onChange={(e) => setUserInput(e.target.value)}
                            placeholder="describe your mood..."
                            className="w-full px-6 py-4 text-lg bg-gray-900 text-white placeholder-gray-500 border border-gray-800 focus:outline-none focus:border-gray-600 transition-colors rounded-lg"
                        />
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                            {/* Filters */}
                             <select id="languageFilter" value={filters.language} onChange={handleFilterChange} className="px-6 py-4 text-base bg-gray-900 text-white border border-gray-800 rounded-lg">
                                <option value="all">all languages</option>
                                <option value="english">english</option>
                                <option value="hindi">hindi</option>
                                <option value="tamil">tamil</option>
                                <option value="telugu">telugu</option>
                                <option value="punjabi">punjabi</option>
                                <option value="marathi">marathi</option>
                                <option value="bengali">bengali</option>
                                <option value="gujarati">gujarati</option>
                                <option value="kannada">kannada</option>
                                <option value="malayalam">malayalam</option>
                                <option value="spanish">spanish</option>
                                <option value="french">french</option>
                                <option value="german">german</option>
                                <option value="japanese">japanese</option>
                                <option value="korean">korean</option>
                                <option value="chinese">chinese</option>
                            </select>
                            <select id="genreFilter" value={filters.genre} onChange={handleFilterChange} className="px-6 py-4 text-base bg-gray-900 text-white border border-gray-800 rounded-lg">
                                <option value="all">all genres</option>
                                <option value="action">action</option>
                                <option value="adventure">adventure</option>
                                <option value="animation">animation</option>
                                <option value="comedy">comedy</option>
                                <option value="crime">crime</option>
                                <option value="documentary">documentary</option>
                                <option value="drama">drama</option>
                                <option value="family">family</option>
                                <option value="fantasy">fantasy</option>
                                <option value="horror">horror</option>
                                <option value="mystery">mystery</option>
                                <option value="romance">romance</option>
                                <option value="sci-fi">sci-fi</option>
                                <option value="thriller">thriller</option>
                                <option value="war">war</option>
                                <option value="western">western</option>
                            </select>
                            <select id="yearFilter" value={filters.year} onChange={handleFilterChange} className="px-6 py-4 text-base bg-gray-900 text-white border border-gray-800 rounded-lg">
                                <option value="all">any year</option>
                                <option value="2025">2025</option>
                                <option value="2024">2024</option>
                                <option value="2023">2023</option>
                                <option value="2022">2022</option>
                                <option value="2021">2021</option>
                                <option value="2020">2020</option>
                                <option value="2010s">2010-2019</option>
                                <option value="2000s">2000-2009</option>
                                <option value="1990s">1990-1999</option>
                                <option value="1980s">1980-1989</option>
                                <option value="classic">before 1980</option>
                            </select>
                        </div>
                        <button type="submit" disabled={isLoading} className="px-8 py-4 text-lg bg-white text-black font-medium rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50">
                            {isLoading ? 'Searching...' : 'Suggest'}
                        </button>
                    </div>
                </form>

                {/* Loading Indicator */}
                {isLoading && (
                    <div className="text-center py-12 animate-pulse-custom">
                        <div className="inline-flex items-center">
                            <div className="animate-spin rounded-full h-6 w-6 border-b border-white mr-4"></div>
                            <span className="text-gray-400 text-lg">Searching...</span>
                        </div>
                    </div>
                )}

                {/* Error Message */}
                {error && <div className="border border-red-800 bg-red-900/20 p-6 mb-8 rounded-lg text-center text-red-400">{error}</div>}

                {/* Results Section */}
                {movies.length > 0 && (
                    <section className="animate-fadeIn">
                        <h2 className="text-xl text-white font-medium mb-6">Your Movie Suggestions</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {movies.map((movie, index) => (
                                <div key={movie.imdbID} className="movie-card bg-gray-900/50 p-4 rounded-lg hover:bg-gray-800/70 transition-transform duration-300 hover:-translate-y-2" style={{ animationDelay: `${index * 50}ms`}}>
                                    <img 
                                        src={movie.Poster} 
                                        alt={`Poster for ${movie.Title}`} 
                                        className="w-full h-96 object-cover mb-4 rounded" 
                                        onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/400x600/111827/374151?text=Poster+Not+Found'; }}
                                    />
                                    <div>
                                        <h3 className="text-white font-medium text-lg mb-2 h-14">{movie.Title}</h3>
                                        <p className="text-gray-500 text-base mb-3">{movie.Year}</p>
                                        <a href={`https://www.imdb.com/title/${movie.imdbID}`} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white text-xs transition-colors">
                                            View on IMDb →
                                        </a>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}
            </main>

            <footer className="text-center py-8 mt-16">
                <p className="text-gray-600 text-xs">powered by gemini & omdb</p>
            </footer>
        </div>
    );
}

export default App;

