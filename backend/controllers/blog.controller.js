import mongoose from 'mongoose';
import {Blog} from '../models/blog.model.js';
import {User} from '../models/user.model.js';
import { ApiError } from '../utils/apiError.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';


// Create a new blog post
const postBlog = asyncHandler(async(req, res) => {
    const { title , description, content, theme } = req.body;
    const authorId = req.user._id;

    if (!title || !description || !content || !theme) {
        throw new ApiError(400, 'title, description, content and theme are required');
    }

    const author = await User.findById(authorId);
    if (!author) {
        throw new ApiError(404, 'Author not found');
    }

    const newBlog = await Blog.create({
        title,
        description,
        content,
        theme,
        author: authorId
    })

    if(!newBlog) {
        throw new ApiError(500, 'Failed to create blog post');
    }
    return res
    .status(200)
    .json(new ApiResponse(200, 'Blog post created successfully' , newBlog))
});

// get all blog posts
// we are trying to implement pagination and filtering by theme
const getAllBlogs = asyncHandler(async(req, res) => {
    // We are implementing pagination and filters for the blogs
    // so we will use query parameters to get the page number and theme
    const {page,limit,theme} = req.query;

    // we have to set default values for page and limit to avoid crashing the server
    const pageNumber = parseInt(page) || 1;
    const pageSize = parseInt(limit) || 5;

    // we will filter the blogs by theme if the theme is provided
    const filters = {author: req.user._id}; // filter by logged-in user
    if (theme) {
        filters.theme = theme;
    }

    // we will skip the blogs based on the page number and limit
    const skip = (pageNumber - 1) * pageSize;

    // now lets get the blogs from the database
    const blogs = await Blog.find(filters)
        .skip(skip)
        .limit(pageSize)
        .populate('author', 'username') // populate author details
        .sort({ createdAt: -1 }); // sort by createdAt in descending order

    // we get the blogs now we have to get the total number of blogs
    const totalBlogs = await Blog.countDocuments(filters);
    const totalPages = Math.ceil(totalBlogs / pageSize);

    return res
        .status(200)
        .json(new ApiResponse(200, 'Blogs fetched successfully', {
            blogs,
            totalBlogs,
            totalPages,
            currentPage: pageNumber
        }));
})

const getAllPublicBlogs = asyncHandler(async(req, res) => {
    const {page, limit, theme} = req.query;
    const pageNumber = parseInt(page) || 1;
    const pageSize = parseInt(limit) || 10;
    const filters = {};
    if (theme) {
        filters.theme = theme;
    }
    const skip = (pageNumber - 1) * pageSize;
    const blogs = await Blog.find(filters)
        .skip(skip)
        .limit(pageSize)
        .populate('author', 'username')
        .sort({ createdAt: -1 });
    const totalBlogs = await Blog.countDocuments(filters);
    const totalPages = Math.ceil(totalBlogs / pageSize);

    // ✅ FIXED: The response now uses the correct ApiResponse format
    // that the frontend expects.
    return res
        .status(200)
        .json(new ApiResponse(200, {
            blogs,
            totalBlogs,
            totalPages,
            currentPage: pageNumber
        }, 'All public blogs fetched successfully'));
});
// get a single blog post by id 
const getBlogById = asyncHandler(async(req, res) => {
    const {id} = req.params;

    if(mongoose.isValidObjectId(id)) {
        const blog = await Blog.findById(id).populate('author', 'username');
        if (!blog) {
            throw new ApiError(404, 'Blog post not found');
        }
        return res
            .status(200)
            .json(new ApiResponse(200, 'Blog post fetched successfully', blog));
    }
    throw new ApiError(400, 'Invalid blog post ID');
});

// lets handle the share functionality , we will increment the share count of the blog post
const shareBlog = asyncHandler(async(req,res)=>{
    const {id} = req.params;

    if(mongoose.isValidObjectId(id)){
        const updatedBlog = await Blog.findByIdAndUpdate(id,{$inc:{share:1}},{new:true});
        if (!updatedBlog) {
            throw new ApiError(404, 'Blog post not found');
        }
        return res
            .status(200)
            .json(new ApiResponse(200, 'Blog post shared successfully', {shareBlog: updatedBlog.share}));
    }
})


const searchBlogs = asyncHandler(async(req,res)=> {
    const {query , page , limit, theme} = req.query; 
    if (!query) {
        throw new ApiError(400, 'Search query is required');
    }
    const pageNumber = parseInt(page) || 1;
    const pageSize = parseInt(limit) || 10;
    
    // ✅ FIXED: Added author filter to only search within the logged-in user's blogs.
    const filters = {
        author: req.user._id, // This requires verifyJWT middleware on the route
        $or:[
            { title: {$regex: query, $options:"i"} },
            { description: {$regex:query, $options:"i"} }
        ]
    };

    if (theme) {
        filters.theme = theme;
    }
    const skip = (pageNumber-1) * pageSize;
    const blogs = await Blog
        .find(filters)
        .skip(skip)
        .limit(pageSize)
        .populate('author', 'username')
        .sort({ createdAt: -1 });
    
    const totalBlogs = await Blog.countDocuments(filters);
    const totalPages = Math.ceil(totalBlogs / pageSize);

    return res.status(200).json(new ApiResponse(200, {
        blogs,
        totalBlogs,
        totalPages,
        currentPage: pageNumber
    }, 'Blogs fetched successfully'));
})
// delete a blog post by id
const deleteBlog = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
        throw new ApiError(400, 'Invalid blog post ID');
    }

    const blog = await Blog.findById(id);
    if (!blog) {
        throw new ApiError(404, 'Blog post not found');
    }

    // Check if the logged-in user is the owner of the blog
    if (blog.author.toString() !== req.user._id.toString()) {
        throw new ApiError(403, 'You are not authorized to delete this blog');
    }

    const deletedBlog = await Blog.findByIdAndDelete(id);

    return res
        .status(200)
        .json(new ApiResponse(200, 'Blog post deleted successfully', deletedBlog));
});

export { postBlog , getAllBlogs , getBlogById , shareBlog , searchBlogs ,deleteBlog , getAllPublicBlogs };