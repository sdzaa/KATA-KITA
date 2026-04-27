/**
 * forum.js - Kindness Feed Logic & Dashboard Integration
 * Refactored for scalability, maintainability, and clean code principles.
 */

const PostManager = {
    STORAGE_KEY: 'katakita_posts',
    LIKED_KEY_PREFIX: 'katakita_liked_',

    getDefaultPosts() {
        return [
            {
                id: '1',
                author: 'Sunflower',
                content: '"Today I feel a bit tired because of school assignments, but luckily a friend invited me to grab some snacks together..."',
                mood: 'sad',
                timestamp: Date.now() - 3600000 * 4,
                likes: 24,
                comments: [
                    { id: '11', content: 'Keep your spirits up!', timestamp: Date.now() },
                    { id: '12', content: 'Virtual hug for you!', timestamp: Date.now() }
                ]
            },
            {
                id: '2',
                author: 'Sunflower',
                content: '"Sometimes the smallest step in the right direction ends up being the biggest step of your life. Tip-toe if you must, but take the step."',
                mood: 'comfort',
                timestamp: Date.now() - 3600000 * 8,
                likes: 42,
                comments: []
            }
        ];
    },

    getPosts() {
        const raw = localStorage.getItem(this.STORAGE_KEY);
        if (!raw) {
            const defaults = this.getDefaultPosts();
            this.savePosts(defaults);
            return defaults;
        }
        return JSON.parse(raw);
    },

    savePosts(posts) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(posts));
    },

    addPost(mood, content) {
        const posts = this.getPosts();
        const newPost = {
            id: Date.now().toString(),
            author: (typeof AppState !== 'undefined' && AppState.getUser()) || 'Anonymous',
            content: `"${content}"`,
            mood,
            timestamp: Date.now(),
            likes: 0,
            comments: []
        };
        posts.unshift(newPost);
        this.savePosts(posts);
        return newPost;
    },

    toggleLike(postId) {
        const posts = this.getPosts();
        const index = posts.findIndex(p => p.id === postId);
        if (index === -1) return null;

        const key = this.LIKED_KEY_PREFIX + postId;
        const isLiked = localStorage.getItem(key);

        if (isLiked) {
            posts[index].likes = Math.max(0, posts[index].likes - 1);
            localStorage.removeItem(key);
        } else {
            posts[index].likes += 1;
            localStorage.setItem(key, 'true');
        }

        this.savePosts(posts);
        return { likes: posts[index].likes, isLiked: !isLiked };
    },

    addComment(postId, content) {
        const posts = this.getPosts();
        const index = posts.findIndex(p => p.id === postId);
        if (index === -1) return null;

        const newComment = {
            id: Date.now().toString(),
            content,
            timestamp: Date.now()
        };

        if (!posts[index].comments) posts[index].comments = [];
        posts[index].comments.push(newComment);
        this.savePosts(posts);
        return newComment;
    }
};

const FeedUI = {
    elements: {
        feedContainer: document.getElementById('feedPosts'),
        postForm: document.getElementById('postForm'),
        moodSelect: document.getElementById('postMood'),
        contentInput: document.getElementById('postContent'),
        modal: document.getElementById('composeModal'),
        openModalBtn: document.getElementById('openComposeBtn'),
        closeModalBtn: document.getElementById('closeModal'),
        filterBtns: document.querySelectorAll('.filter-btn')
    },

    init() {
        this.render();
        this.bindEvents();
    },

    bindEvents() {
        // Event Delegation for Feed Interactions
        this.elements.feedContainer?.addEventListener('click', (e) => {
            const target = e.target.closest('button');
            if (!target) return;

            const postId = target.dataset.id;
            if (target.classList.contains('like-btn')) {
                this.handleLike(postId, target);
            } else if (target.classList.contains('comment-btn')) {
                this.toggleComments(postId);
            }
        });

        // Comment Submission Event Delegation
        this.elements.feedContainer?.addEventListener('submit', (e) => {
            if (e.target.classList.contains('comment-form')) {
                e.preventDefault();
                this.handleCommentSubmit(e.target);
            }
        });

        // Modal Logic
        this.elements.openModalBtn?.addEventListener('click', () => this.toggleModal(true));
        this.elements.closeModalBtn?.addEventListener('click', () => this.toggleModal(false));
        window.addEventListener('click', (e) => {
            if (e.target === this.elements.modal) this.toggleModal(false);
        });

        // Form Submission
        this.elements.postForm?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handlePostSubmit();
        });

        // Filters
        this.elements.filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.elements.filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.render(btn.dataset.filter);
            });
        });
    },

    toggleModal(show) {
        if (!this.elements.modal) return;
        this.elements.modal.style.display = show ? 'flex' : 'none';
        if (show) this.elements.contentInput?.focus();
    },

    handlePostSubmit() {
        const mood = this.elements.moodSelect.value;
        const content = this.elements.contentInput.value.trim();

        if (!content) return;

        PostManager.addPost(mood, content);
        
        if (typeof AppState !== 'undefined') AppState.addPoints(10);
        
        this.elements.postForm.reset();
        this.toggleModal(false);
        
        const activeFilter = document.querySelector('.filter-btn.active')?.dataset.filter || 'all';
        this.render(activeFilter);
    },

    handleLike(postId, btn) {
        const result = PostManager.toggleLike(postId);
        if (!result) return;

        const countEl = btn.querySelector('.likes-count');
        const svg = btn.querySelector('svg');

        if (countEl) countEl.textContent = result.likes;
        if (svg) {
            svg.setAttribute('fill', result.isLiked ? 'currentColor' : 'none');
        }
        btn.classList.toggle('liked', result.isLiked);
    },

    toggleComments(postId) {
        const section = document.getElementById(`comment-section-${postId}`);
        if (section) {
            section.style.display = section.style.display === 'none' ? 'block' : 'none';
            if (section.style.display === 'block') {
                section.querySelector('input')?.focus();
            }
        }
    },

    handleCommentSubmit(form) {
        const postId = form.dataset.id;
        const input = form.querySelector('input');
        const content = input.value.trim();

        if (!content) return;

        const newComment = PostManager.addComment(postId, content);
        if (newComment) {
            if (typeof AppState !== 'undefined') AppState.addPoints(5);
            input.value = '';
            this.updateCommentListUI(postId);
        }
    },

    updateCommentListUI(postId) {
        const posts = PostManager.getPosts();
        const post = posts.find(p => p.id === postId);
        const listEl = document.getElementById(`comment-list-${postId}`);
        const countEl = document.querySelector(`.comment-btn[data-id="${postId}"] .comments-count`);

        if (listEl) {
            listEl.innerHTML = this.templateCommentList(post.comments || []);
        }
        if (countEl) {
            countEl.textContent = post.comments.length;
        }
    },

    render(filter = 'all') {
        if (!this.elements.feedContainer) return;

        let posts = PostManager.getPosts();

        // Sort & Filter
        if (filter === 'popular') {
            posts.sort((a, b) => b.likes - a.likes);
        } else {
            posts.sort((a, b) => b.timestamp - a.timestamp);
        }

        if (filter !== 'all' && filter !== 'popular') {
            posts = posts.filter(p => p.mood === filter);
        }

        this.elements.feedContainer.innerHTML = '';

        if (posts.length === 0) {
            this.elements.feedContainer.innerHTML = `
                <p style="text-align:center; color: var(--color-text-muted); padding: 40px; grid-column: 1 / -1;">
                    No posts yet. Be the first to share kindness!
                </p>`;
            return;
        }

        // Render Highlight if applicable
        if (filter === 'all' && posts.length > 0) {
            const highlightPost = posts[0];
            this.elements.feedContainer.appendChild(this.createHighlightNode(highlightPost));
            posts = posts.slice(1);
        }

        // Render remaining posts
        posts.forEach(post => {
            this.elements.feedContainer.appendChild(this.createPostNode(post));
        });
    },

    createHighlightNode(post) {
        const div = document.createElement('div');
        div.className = 'card post highlight-post';
        div.style.cssText = 'background-color: var(--color-bg-primary); border: 1px solid var(--color-border);';
        div.innerHTML = `
            <div style="font-weight: 700; margin-bottom: 16px; color: var(--color-text-main);">Your last story</div>
            <div style="background: var(--card-bg); padding: 20px; border-radius: 12px; box-shadow: var(--shadow-sm); margin-bottom: 16px;">
                <div class="post-content" style="margin-bottom: 12px; font-style: italic;">${post.content}</div>
                <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.8rem; color: var(--color-text-muted);">
                    <div>Private Post • Recently</div>
                    <div style="background: #FEF3C7; color: #D97706; padding: 4px 12px; border-radius: 20px; font-weight: 600;">+10 Stars</div>
                </div>
            </div>
            <div class="post-footer" style="padding-top: 0; border: none; align-items: center; justify-content: space-between;">
                <div style="display: flex; gap: 20px;">
                    <span style="color: var(--color-primary); display: flex; align-items: center; gap: 6px; font-weight: 600; font-size: 0.9rem;">
                        <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78v0z"></path></svg>
                        Hugs (${post.likes})
                    </span>
                </div>
                <button class="btn btn-primary" style="padding: 8px 24px; border-radius: 20px; font-weight: 600;">See Details</button>
            </div>`;
        return div;
    },

    createPostNode(post) {
        const isLiked = localStorage.getItem(PostManager.LIKED_KEY_PREFIX + post.id);
        const article = document.createElement('article');
        article.className = 'card post animate-fade-in';
        article.innerHTML = `
            <div class="post-header">
                <div class="post-avatar">
                   <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg> 
                </div>
                <div>
                    <div class="post-author">${post.author || 'Anonymous'}</div>
                </div>
            </div>
            <div class="post-content">${post.content}</div>
            <div class="post-time" style="margin-bottom: 16px;">${this.formatTime(post.timestamp)}</div>
            <div class="post-footer">
                <button class="action-btn like-btn ${isLiked ? 'liked' : ''}" data-id="${post.id}">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${isLiked ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                    Send Hug (<span class="likes-count">${post.likes}</span>)
                </button>
                <button class="action-btn comment-btn" data-id="${post.id}">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                    (<span class="comments-count">${post.comments ? post.comments.length : 0}</span>)
                </button>
            </div>
            <div class="comment-section" id="comment-section-${post.id}" style="display: none; padding-top: 16px;">
                <div class="comment-list" id="comment-list-${post.id}">
                    ${this.templateCommentList(post.comments || [])}
                </div>
                <form class="comment-form" data-id="${post.id}" style="display: flex; gap: 8px; margin-top: 12px;">
                    <input type="text" placeholder="Write a comment..." required style="flex:1; padding: 10px; border-radius: 20px; border: 1px solid var(--color-border); background: var(--color-bg-light); color: var(--color-text-main);">
                    <button type="submit" class="btn btn-primary" style="padding: 10px 20px; border-radius: 20px; font-weight: 600;">Send</button>
                </form>
            </div>`;
        return article;
    },

    templateCommentList(comments) {
        if (comments.length === 0) {
            return '<p class="no-comments" style="text-align: center; color: #aaa; font-size: 0.85rem;">No comments yet.</p>';
        }
        return comments.map(c => `
            <div class="comment-item" style="background: var(--color-bg-light); padding: 12px; border-radius: 12px; margin-bottom: 8px;">
                <div style="font-weight: 600; color: var(--color-text-main); font-size: 0.9rem;">Anonymous</div>
                <div style="color: var(--color-text-muted); font-size: 0.9rem; margin: 4px 0;">${c.content}</div>
                <div style="font-size: 0.75rem; color: #aaa;">Just now</div>
            </div>
        `).join('');
    },

    formatTime(timestamp) {
        const diff = Date.now() - timestamp;
        const mins = Math.floor(diff / 60000);
        const hours = Math.floor(mins / 60);
        if (hours > 0) return `${hours} hours ago`;
        if (mins > 0) return `${mins} mins ago`;
        return 'Just now';
    }
};

document.addEventListener('DOMContentLoaded', () => FeedUI.init());
