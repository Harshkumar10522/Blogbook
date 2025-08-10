import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getAllPublicBlogs, searchBlogs } from "../api/apiInstance";
import { BookOpen, Calendar, Search, X } from "lucide-react";

const AllBlogs = () => {
  const [blogs, setBlogs] = useState([]); // Start with an empty array
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalBlogs, setTotalBlogs] = useState(0);
  const [theme, setTheme] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  
  // ✅ FIXED: Calculate totalPages safely, ensuring totalBlogs is a number
  const totalPages = totalBlogs > 0 ? Math.ceil(totalBlogs / limit) : 1;

  const fetchPublicBlogs = async (currentPage, currentTheme, currentQuery) => {
    setLoading(true);
    setError("");
    try {
      let response;
      const params = { page: currentPage, limit, theme: currentTheme || "" };

      if (currentQuery) {
        response = await searchBlogs({ query: currentQuery, ...params });
      } else {
        response = await getAllPublicBlogs(params);
      }

      // ✅ FIXED: Ensure response.data and response.data.blogs exist before setting state
      if (response.success && response.data && Array.isArray(response.data.blogs)) {
        setBlogs(response.data.blogs);
        setTotalBlogs(response.data.totalBlogs || 0);
      } else {
        // Handle cases where the API returns success but data is malformed
        throw new Error("Received invalid data from server.");
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || "Failed to fetch blogs";
      setError(errorMessage);
      setBlogs([]); // Reset to an empty array on error
      setTotalBlogs(0);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchPublicBlogs(1, theme, searchQuery);
  };

  const clearSearch = () => {
    setSearchQuery("");
    setPage(1);
    fetchPublicBlogs(1, theme, "");
  };

  useEffect(() => {
    fetchPublicBlogs(page, theme, searchQuery);
  }, [page, theme]);


  const formatDate = (dateString) => {
    if (!dateString) return "Date not available";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            The Blogbook Community Feed
          </h1>
          <p className="text-lg text-gray-600">
            Explore thoughts and ideas from authors around the world.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 mb-8 flex flex-col md:flex-row gap-4 items-center">
          <form onSubmit={handleSearch} className="flex-grow flex items-center w-full relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title or description..."
              className="border border-gray-300 px-4 py-2 rounded-l-lg w-full focus:ring-indigo-500 focus:border-indigo-500"
            />
             {searchQuery && (
                <button type="button" onClick={clearSearch} className="absolute right-12 p-1 text-gray-400 hover:text-gray-600">
                    <X className="h-5 w-5"/>
                </button>
            )}
            <button
              type="submit"
              className="bg-indigo-600 text-white px-4 py-2 rounded-r-lg hover:bg-indigo-700 transition-colors"
            >
              <Search className="h-5 w-5" />
            </button>
          </form>
          
          <div className="flex items-center space-x-2">
            <label className="font-medium text-gray-700">Theme:</label>
            <select
              value={theme}
              onChange={(e) => { setPage(1); setTheme(e.target.value); }}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">All</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="vincent">Vincent</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
          </div>
        ) : error ? (
          <div className="text-center p-8 bg-red-50 text-red-600 rounded-lg">{error}</div>
        ) : (
          // ✅ FIXED: Check if blogs is an array and has items before mapping
          Array.isArray(blogs) && blogs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {blogs.map((blog) => (
                <div
                  key={blog?._id} // Safe access
                  className="bg-white rounded-2xl shadow-sm overflow-hidden transform hover:-translate-y-1 transition-transform duration-300 flex flex-col"
                >
                  <div className="p-6 flex flex-col flex-grow">
                    <p className="text-sm text-indigo-600 font-semibold uppercase">{blog?.theme}</p>
                    <h3 className="text-xl font-bold text-gray-900 mt-2 mb-3 leading-tight flex-grow">
                      <Link to={`/blog/${blog?._id}`} className="hover:text-indigo-700">{blog?.title}</Link>
                    </h3>
                    <p className="text-gray-600 mt-4 text-sm line-clamp-3">{blog?.description}</p>
                     <div className="mt-auto pt-4">
                      <div className="flex items-center text-sm text-gray-500 mt-4 border-t pt-4">
                          <Calendar className="h-4 w-4 mr-2" />
                          <span>{formatDate(blog?.createdAt)}</span>
                          <span className="mx-2">•</span>
                          <span>By {blog?.author?.username || 'Unknown'}</span>
                      </div>
                       <Link
                          to={`/blog/${blog?._id}`}
                          className="inline-block mt-4 text-indigo-600 hover:text-indigo-800 font-semibold"
                        >
                          Read More →
                        </Link>
                     </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center p-8 bg-white rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold text-gray-700">No Blogs Found</h3>
                <p className="text-gray-500 mt-2">Try adjusting your search or filter.</p>
            </div>
          )
        )}

        {totalPages > 1 && !loading && (
            <div className="flex justify-center items-center mt-12">
                <button
                    disabled={page === 1}
                    onClick={() => setPage((p) => p - 1)}
                    className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-l-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Previous
                </button>
                <span className="bg-white border-t border-b border-gray-300 text-indigo-600 px-4 py-2 font-semibold">
                    Page {page} of {totalPages}
                </span>
                <button
                    disabled={page === totalPages || totalPages === 0}
                    onClick={() => setPage((p) => p + 1)}
                    className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-r-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Next
                </button>
            </div>
        )}
      </div>
    </div>
  );
};

export default AllBlogs;