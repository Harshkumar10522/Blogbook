import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getAllBlogs, searchBlogs, deleteBlog } from "../api/apiInstance";
import { Plus, BookOpen, Calendar, User, Trash2, Edit } from "lucide-react";

const Dashboard = () => {
  const { user } = useAuth();
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(5);
  const [totalBlogs, setTotalBlogs] = useState(0);
  const [theme, setTheme] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const totalPages = totalBlogs > 0 ? Math.ceil(totalBlogs / limit) : 1;

  const fetchData = async (currentPage, currentTheme, currentQuery) => {
    setLoading(true);
    setError("");
    try {
      let response;
      const params = { page: currentPage, limit, theme: currentTheme || "" };

      if (currentQuery) {
        response = await searchBlogs({ query: currentQuery, ...params });
      } else {
        response = await getAllBlogs(params);
      }
      
      // ✅ ROBUST FIX: The backend is sometimes sending the payload in `response.data`
      // and sometimes in `response.message`. This code now checks both to prevent crashing.
      const payload = response.data?.blogs ? response.data : response.message;

      if (response.success && payload && Array.isArray(payload.blogs)) {
        setBlogs(payload.blogs);
        setTotalBlogs(payload.totalBlogs || 0);
      } else {
        throw new Error("Received invalid data from server.");
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || "Failed to fetch blogs";
      setError(errorMessage);
      setBlogs([]);
      setTotalBlogs(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(page, theme, searchQuery);
  }, [page, theme]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchData(1, theme, searchQuery);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this blog?")) {
      try {
        await deleteBlog(id);
        // Refetch the current page after deletion
        fetchData(page, theme, searchQuery);
      } catch (err) {
        alert(err.response?.data?.message || "Failed to delete");
      }
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm p-8 mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Welcome back, {user?.username}!
              </h1>
              <p className="text-gray-600">
                Ready to share your thoughts with the world?
              </p>
            </div>
            <Link
              to="/compose"
              className="mt-4 sm:mt-0 bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors flex items-center space-x-2 shadow-lg"
            >
              <Plus className="h-5 w-5" />
              <span>New Blog</span>
            </Link>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-4 mb-8">
            <form onSubmit={handleSearch} className="flex-grow w-full">
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search your blogs..."
                    className="border border-gray-300 px-4 py-2 rounded-lg w-full"
                />
            </form>
            <div className="flex items-center space-x-2">
                <label className="font-medium">Theme:</label>
                <select
                    value={theme}
                    onChange={(e) => { setPage(1); setTheme(e.target.value); }}
                    className="border border-gray-300 rounded-lg px-3 py-2"
                >
                    <option value="">All</option>
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="vincent">Vincent</option>
                </select>
            </div>
        </div>

        {/* Blogs List */}
        <div className="bg-white rounded-2xl shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Your Blogs ({totalBlogs})</h2>
          </div>

          {loading ? (
            <div className="p-6 text-center">Loading...</div>
          ) : error ? (
            <div className="p-6 text-red-600">{error}</div>
          ) : Array.isArray(blogs) && blogs.length > 0 ? (
            blogs.map((blog) => (
              <div
                key={blog._id}
                className="p-6 border-b hover:bg-gray-50 transition flex justify-between items-center"
              >
                <div>
                    <h3 className="text-lg font-bold text-gray-900">
                        {blog.title}
                    </h3>
                    <p className="text-gray-600 mb-2 text-sm">
                        Published on {formatDate(blog.createdAt)}
                    </p>
                    <Link
                        to={`/blog/${blog._id}`}
                        className="text-indigo-600 hover:underline font-medium text-sm"
                    >
                        Read More →
                    </Link>
                </div>
                <div className="flex items-center space-x-4">
                    <Link to={`/edit/${blog._id}`} className="text-gray-500 hover:text-indigo-600">
                        <Edit className="h-5 w-5"/>
                    </Link>
                    <button onClick={() => handleDelete(blog._id)} className="text-gray-500 hover:text-red-600">
                        <Trash2 className="h-5 w-5"/>
                    </button>
                </div>
              </div>
            ))
          ) : (
            <div className="p-6 text-center text-gray-500">No blogs found.</div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && !loading && (
            <div className="flex justify-center items-center mt-6">
                <button
                    disabled={page === 1}
                    onClick={() => setPage((p) => p - 1)}
                    className="bg-gray-200 px-4 py-2 rounded-l-lg disabled:opacity-50"
                >
                    Prev
                </button>
                <span className="px-4 py-2 bg-white border-t border-b">
                    Page {page} of {totalPages}
                </span>
                <button
                    disabled={page === totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    className="bg-gray-200 px-4 py-2 rounded-r-lg disabled:opacity-50"
                >
                    Next
                </button>
            </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;