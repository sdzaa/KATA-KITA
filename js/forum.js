const ContentFilter = {
    FORBIDDEN_WORDS: [
        // Profanity & Cyberbullying (Indonesian)
        'anjing', 'babi', 'monyet', 'tolol', 'goblok', 'bego', 'bodoh', 'idiot',
        'kontol', 'memek', 'ngentot', 'bangsat', 'brengsek', 'tai', 'asu',
        'mati saja', 'sampah', 'jelek', 'pecundang', 'cacat', 'bencong',
        // Profanity & Cyberbullying (English)
        'fuck', 'shit', 'asshole', 'bitch', 'idiot', 'stupid', 'dumb', 'loser',
        'kill yourself', 'kys', 'suicide', 'ugly', 'trash', 'hate you',
        // Harmful Mental Health Phrases
        'bunuh diri', 'self harm', 'potong nadi', 'lompat gedung'
    ],

    validate(text) {
        const lowerText = text.toLowerCase();
        const foundWord = this.FORBIDDEN_WORDS.find(word => lowerText.includes(word));
        if (foundWord) {
            if (typeof showModal === 'function') {
                showModal(
                    'Inappropriate Content',
                    'Your message contains words that are not allowed in this space. Let\'s keep this community kind and safe! ❤️',
                    '⚠️'
                );
            } else {
                alert('Inappropriate content detected. Please be kind!');
            }
            return false;
        }
        return true;
    }
};

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
            this.savePosts([]);
            return [];
        }
        return JSON.parse(raw);
    },

    savePosts(posts) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(posts));
    },

    addPost(mood, content) {
        const posts = this.getPosts();
        const currentUser = (typeof AppState !== 'undefined' && AppState.getUser());
        const displayName = (typeof AppState !== 'undefined' && AppState.getDisplayName()) || 'Anonymous';
        const newPost = {
            id: Date.now().toString(),
            author: displayName,
            username: currentUser,
            content: `"${content}"`,
            mood,
            timestamp: Date.now(),
            likes: 0,
            comments: []
        };
        posts.unshift(newPost);
        this.savePosts(posts);

        // Sync with Google Sheets backend
        if (typeof KatakitaAPI !== 'undefined') {
            KatakitaAPI.sync('insert', {
                tableName: 'kindness_feeds',
                username: newPost.username,
                story: content
            });
        }

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

            // Sync with Google Sheets backend only when sending a hug
            if (typeof KatakitaAPI !== 'undefined') {
                KatakitaAPI.sync('add_hug', {
                    story_id: postId
                });
            }
        }

        this.savePosts(posts);
        return { likes: posts[index].likes, isLiked: !isLiked };
    },

    addComment(postId, content) {
        const posts = this.getPosts();
        const index = posts.findIndex(p => p.id === postId);
        if (index === -1) return null;

        const currentUser = (typeof AppState !== 'undefined' && AppState.getUser());
        const displayName = (typeof AppState !== 'undefined' && AppState.getDisplayName()) || 'Anonymous';

        const newComment = {
            id: Date.now().toString(),
            author: displayName,
            username: currentUser,
            content,
            timestamp: Date.now(),
            replies: []
        };

        if (!posts[index].comments) posts[index].comments = [];
        posts[index].comments.push(newComment);
        this.savePosts(posts);

        // Sync comment with Google Sheets backend
        if (typeof KatakitaAPI !== 'undefined') {
            KatakitaAPI.sync('insert', {
                tableName: 'kindness_feeds_comments',
                story_id: postId,
                comment: content,
                username: currentUser || '',
                display_name: displayName || ''
            });
        }

        return newComment;
    },

    deletePost(id) {
        let posts = this.getPosts();
        posts = posts.filter(p => p.id !== id);
        this.savePosts(posts);
    },

    editPost(id, newContent) {
        const posts = this.getPosts();
        const index = posts.findIndex(p => p.id === id);
        if (index > -1) {
            posts[index].content = newContent;
            this.savePosts(posts);
            return true;
        }
        return false;
    },

    addReply(postId, commentId, content) {
        const posts = this.getPosts();
        const post = posts.find(p => p.id === postId);
        if (!post || !post.comments) return null;

        const comment = post.comments.find(c => c.id === commentId);
        if (!comment) return null;

        const currentUser = (typeof AppState !== 'undefined' && AppState.getUser());
        const displayName = (typeof AppState !== 'undefined' && AppState.getDisplayName()) || 'Anonymous';

        const newReply = {
            id: Date.now().toString(),
            author: displayName,
            username: currentUser,
            content,
            timestamp: Date.now()
        };

        if (!comment.replies) comment.replies = [];
        comment.replies.push(newReply);
        this.savePosts(posts);
        return newReply;
    }
};

const FeedUI = {
    postToDelete: null,
    postToEdit: null,
    userHighlight: null,
    elements: {
        feedContainer: document.getElementById('feedPosts'),
        postForm: document.getElementById('postForm'),
        moodSelect: document.getElementById('postMood'),
        contentInput: document.getElementById('postContent'),
        modal: document.getElementById('composeModal'),
        openModalBtn: document.getElementById('openComposeBtn'),
        closeModalBtn: document.getElementById('closeModal'),
        filterBtns: document.querySelectorAll('.filter-btn'),
        deleteModal: document.getElementById('deleteConfirmModal'),
        cancelDeleteBtn: document.getElementById('cancelDeleteBtn'),
        confirmDeleteBtn: document.getElementById('confirmDeleteBtn'),
        editModal: document.getElementById('editPostModal'),
        editPostForm: document.getElementById('editPostForm'),
        editPostContent: document.getElementById('editPostContent'),
        closeEditModalBtn: document.getElementById('closeEditModalBtn')
    },

    init() {
        if (this.elements.feedContainer) {
            this.elements.feedContainer.innerHTML = '<p style="text-align: center; color: var(--color-text-muted); padding: 40px;">Loading posts...</p>';
        }

        if (typeof KatakitaAPI !== 'undefined') {
            KatakitaAPI.request('get_data', { tables: ['kindness_feeds', 'kindness_feeds_comments', 'user'] })
                .then(response => {
                    if (response && response.result === 'success' && response.data) {
                        let feeds = response.data.kindness_feeds || [];
                        const comments = response.data.kindness_feeds_comments || [];
                        const users = response.data.user || [];

                        // build username -> display_name map
                        const userMap = {};
                        users.forEach(u => {
                            if (u && u.username) {
                                userMap[u.username.toString()] = (u.display_name && u.display_name.toString()) || u.username.toString();
                            }
                        });

                        // Use the current user's last feed as the highlight (if logged in)
                        const currentUser = (typeof AppState !== 'undefined' && AppState.getUser()) || null;
                        this.userHighlight = null;
                        if (currentUser) {
                            const userFeeds = feeds.filter(f => f.username && f.username.toString() === currentUser.toString());
                            if (userFeeds.length > 0) {
                                const lastFeed = userFeeds.reduce((a, b) => (parseInt(a.id) > parseInt(b.id) ? a : b));
                                const lastComments = comments
                                    .filter(c => c.story_id && c.story_id.toString() === lastFeed.id.toString())
                                    .map(c => ({
                                        id: c.id.toString(),
                                        content: c.comment,
                                        timestamp: new Date(c.date).getTime() || Date.now(),
                                        username: c.username || '',
                                        author: c.display_name || 'Anonymous',
                                        replies: []
                                    }));

                                this.userHighlight = {
                                    id: lastFeed.id.toString(),
                                    author: userMap[lastFeed.username] || lastFeed.display_name || 'Anonymous',
                                    content: lastFeed.story && lastFeed.story.startsWith('"') ? lastFeed.story : `"${lastFeed.story || ''}"`,
                                    mood: 'comfort',
                                    timestamp: (lastFeed.date ? new Date(lastFeed.date).getTime() : Date.now()),
                                    likes: parseInt(lastFeed.hugs) || 0,
                                    comments: lastComments
                                };
                            }
                        }

                        const posts = feeds.map(feed => {
                            const postComments = comments
                                .filter(c => c.story_id && c.story_id.toString() === feed.id.toString())
                                .map(c => ({
                                    id: c.id.toString(),
                                    content: c.comment,
                                    timestamp: new Date(c.date).getTime() || Date.now(),
                                    username: c.username || '',
                                    author: c.display_name || 'Anonymous',
                                    replies: []
                                }));

                            return {
                                id: feed.id.toString(),
                                username: feed.username,
                                author: userMap[feed.username] || feed.display_name || 'Anonymous',
                                content: feed.story && feed.story.startsWith('"') ? feed.story : `"${feed.story || ''}"`,
                                mood: 'comfort',
                                timestamp: (feed.date ? new Date(feed.date).getTime() : Date.now()),
                                likes: parseInt(feed.hugs) || 0,
                                comments: postComments
                            };
                        });

                        posts.reverse();
                        PostManager.savePosts(posts);
                    }
                    this.render();
                    this.bindEvents();
                })
                .catch(err => {
                    console.error('Error fetching forum data:', err);
                    this.render();
                    this.bindEvents();
                });
        } else {
            this.render();
            this.bindEvents();
        }
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
            } else if (target.classList.contains('delete-btn')) {
                this.handleDelete(postId);
            } else if (target.classList.contains('edit-btn')) {
                this.handleEdit(postId);
            } else if (target.classList.contains('reply-btn')) {
                this.toggleReplyForm(target.dataset.commentId);
            }
        });

        // Comment Submission Event Delegation
        this.elements.feedContainer?.addEventListener('submit', (e) => {
            if (e.target.classList.contains('comment-form')) {
                e.preventDefault();
                this.handleCommentSubmit(e.target);
            } else if (e.target.classList.contains('reply-form')) {
                e.preventDefault();
                this.handleReplySubmit(e.target);
            }
        });

        // Modal Logic
        this.elements.openModalBtn?.addEventListener('click', () => this.toggleModal(true));
        this.elements.closeModalBtn?.addEventListener('click', () => this.toggleModal(false));

        this.elements.cancelDeleteBtn?.addEventListener('click', () => this.toggleDeleteModal(false));
        this.elements.confirmDeleteBtn?.addEventListener('click', () => this.confirmDelete());

        this.elements.closeEditModalBtn?.addEventListener('click', () => this.toggleEditModal(false));

        window.addEventListener('click', (e) => {
            if (e.target === this.elements.modal) this.toggleModal(false);
            if (e.target === this.elements.deleteModal) this.toggleDeleteModal(false);
            if (e.target === this.elements.editModal) this.toggleEditModal(false);
        });

        // Form Submission
        this.elements.postForm?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handlePostSubmit();
        });

        this.elements.editPostForm?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.confirmEdit();
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

    toggleDeleteModal(show) {
        if (!this.elements.deleteModal) return;
        this.elements.deleteModal.style.display = show ? 'flex' : 'none';
        if (!show) this.postToDelete = null;
    },

    handleDelete(postId) {
        this.postToDelete = postId;
        this.toggleDeleteModal(true);
    },

    confirmDelete() {
        if (this.postToDelete) {
            PostManager.deletePost(this.postToDelete);
            const activeFilter = document.querySelector('.filter-btn.active')?.dataset.filter || 'all';
            this.render(activeFilter);
        }
        this.toggleDeleteModal(false);
    },

    toggleEditModal(show, content = '') {
        if (!this.elements.editModal) return;
        this.elements.editModal.style.display = show ? 'flex' : 'none';
        if (show) {
            if (this.elements.editPostContent) {
                this.elements.editPostContent.value = content.replace(/^"|"$/g, '');
                this.elements.editPostContent.focus();
            }
        } else {
            this.postToEdit = null;
        }
    },

    handleEdit(postId) {
        const posts = PostManager.getPosts();
        const post = posts.find(p => p.id === postId);
        if (!post) return;

        this.postToEdit = postId;
        this.toggleEditModal(true, post.content);
    },

    confirmEdit() {
        if (!this.postToEdit) return;

        const content = this.elements.editPostContent?.value.trim();
        if (content) {
            if (!ContentFilter.validate(content)) return;
            PostManager.editPost(this.postToEdit, `"${content}"`);
            const activeFilter = document.querySelector('.filter-btn.active')?.dataset.filter || 'all';
            this.render(activeFilter);
        }

        this.toggleEditModal(false);
    },

    toggleReplyForm(commentId) {
        const form = document.getElementById(`reply-form-${commentId}`);
        if (form) {
            form.style.display = form.style.display === 'none' ? 'flex' : 'none';
            if (form.style.display === 'flex') {
                form.querySelector('input')?.focus();
            }
        }
    },

    handleReplySubmit(form) {
        const postId = form.dataset.postId;
        const commentId = form.dataset.commentId;
        const input = form.querySelector('input');
        const content = input.value.trim();

        if (!content) return;
        if (!ContentFilter.validate(content)) return;

        const newReply = PostManager.addReply(postId, commentId, content);
        if (newReply) {
            input.value = '';
            this.updateCommentListUI(postId);
        }
    },

    handlePostSubmit() {
        const mood = this.elements.moodSelect.value;
        const content = this.elements.contentInput.value.trim();

        if (!content) return;
        if (!ContentFilter.validate(content)) return;

        PostManager.addPost(mood, content);

        if (typeof AppState !== 'undefined') {
            AppState.addPoints(10);
            AppState.checkAndCompleteTask('kindness');
        }

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
        if (!ContentFilter.validate(content)) return;

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
            listEl.innerHTML = this.templateCommentList(postId, post.comments || []);
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
            const lang = (typeof AppState !== 'undefined') ? AppState.getLanguage() : 'id';
            const emptyFeedMsg = (typeof TRANSLATIONS !== 'undefined' && TRANSLATIONS[lang]['forum_empty_feed']) || "There's no story yet.";
            this.elements.feedContainer.innerHTML = `
                <p style="text-align:center; color: var(--color-text-muted); padding: 40px; grid-column: 1 / -1;">
                    ${emptyFeedMsg}
                </p>`;
            return;
        }

        // Render Highlight if applicable
        if (filter === 'all') {
            if (this.userHighlight) {
                const currentHighlightPost = posts.find(p => p.id === this.userHighlight.id) || this.userHighlight;
                this.elements.feedContainer.appendChild(this.createHighlightNode(currentHighlightPost, 'Your last story'));
            }
        }

        // Render remaining posts
        posts.forEach(post => {
            if (this.userHighlight && post.id === this.userHighlight.id) {
                return; // Skip rendering the highlight post again
            }
            this.elements.feedContainer.appendChild(this.createPostNode(post));
        });
    },

    createHighlightNode(post, titleText = 'Your last story') {
        const div = document.createElement('div');
        div.className = 'card post highlight-post';
        div.style.cssText = 'background-color: var(--color-bg-primary); border: 1px solid var(--color-border);';
        div.innerHTML = `
            <div style="font-weight: 700; margin-bottom: 16px; color: var(--color-text-main);">${titleText}</div>
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
                <button class="btn btn-primary" onclick="FeedUI.toggleComments('${post.id}')" style="padding: 8px 24px; border-radius: 20px; font-weight: 600; cursor: pointer; position: relative; z-index: 10;">See Details</button>
            </div>
            <div class="comment-section" id="comment-section-${post.id}" style="display: none; padding-top: 16px; border-top: 1px solid var(--color-border); margin-top: 16px;">
                <div class="comment-list" id="comment-list-${post.id}">
                    ${this.templateCommentList(post.id, post.comments || [])}
                </div>
                <form class="comment-form" data-id="${post.id}" style="display: flex; gap: 8px; margin-top: 12px;">
                    <input type="text" placeholder="Write a comment..." required style="flex:1; padding: 10px; border-radius: 20px; border: 1px solid var(--color-border); background: var(--color-bg-light); color: var(--color-text-main);">
                    <button type="submit" class="btn btn-primary" style="padding: 10px 20px; border-radius: 20px; font-weight: 600;">Send</button>
                </form>
            </div>`;
        return div;
    },

    createPostNode(post) {
        const isLiked = localStorage.getItem(PostManager.LIKED_KEY_PREFIX + post.id);
        const currentUser = (typeof AppState !== 'undefined' && AppState.getUser()) || null;
        const isAuthor = currentUser && post.username && post.username === currentUser;

        let actionButtons = '';
        if (isAuthor) {
            actionButtons = `
                <div style="display: flex; gap: 8px;">
                    <button class="action-btn edit-btn" data-id="${post.id}" title="Edit Post">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                    </button>
                    <button class="action-btn delete-btn" data-id="${post.id}" title="Delete Post" style="color: #ef4444;">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                </div>
            `;
        }

        const article = document.createElement('article');
        article.className = 'card post animate-fade-in';
        article.innerHTML = `
            <div class="post-header" style="justify-content: space-between; display: flex; width: 100%;">
                <div style="display: flex; gap: 12px; align-items: center;">
                    <div class="post-avatar">
                       <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg> 
                    </div>
                    <div>
                        <div class="post-author">${post.author || 'Anonymous'}</div>
                    </div>
                </div>
                ${actionButtons}
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
                    ${this.templateCommentList(post.id, post.comments || [])}
                </div>
                <form class="comment-form" data-id="${post.id}" style="display: flex; gap: 8px; margin-top: 12px;">
                    <input type="text" placeholder="Write a comment..." required style="flex:1; padding: 10px; border-radius: 20px; border: 1px solid var(--color-border); background: var(--color-bg-light); color: var(--color-text-main);">
                    <button type="submit" class="btn btn-primary" style="padding: 10px 20px; border-radius: 20px; font-weight: 600;">Send</button>
                </form>
            </div>`;
        return article;
    },

    templateCommentList(postId, comments) {
        if (comments.length === 0) {
            return '<p class="no-comments" style="text-align: center; color: #aaa; font-size: 0.85rem;">No comments yet.</p>';
        }
        return comments.map(c => `
            <div class="comment-item" style="background: var(--color-bg-light); padding: 12px; border-radius: 12px; margin-bottom: 8px;">
                <div style="font-weight: 600; color: var(--color-text-main); font-size: 0.9rem;">${c.author || c.username || 'Anonymous'}</div>
                <div style="color: var(--color-text-muted); font-size: 0.9rem; margin: 4px 0;">${c.content}</div>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div style="font-size: 0.75rem; color: #aaa;">${this.formatTime(c.timestamp)}</div>
                    <button class="action-btn reply-btn" data-comment-id="${c.id}" style="font-size: 0.75rem; padding: 0;">Reply</button>
                </div>
                
                ${c.replies && c.replies.length > 0 ? `
                <div class="replies-list" style="margin-top: 8px; padding-left: 12px; border-left: 2px solid var(--color-border);">
                    ${c.replies.map(r => `
                        <div class="reply-item" style="margin-bottom: 6px;">
                            <div style="font-weight: 600; color: var(--color-text-main); font-size: 0.85rem;">${r.author || r.username || 'Anonymous'}</div>
                            <div style="color: var(--color-text-muted); font-size: 0.85rem; margin: 2px 0;">${r.content}</div>
                            <div style="font-size: 0.7rem; color: #aaa;">${this.formatTime(r.timestamp)}</div>
                        </div>
                    `).join('')}
                </div>
                ` : ''}
                
                <form class="reply-form" id="reply-form-${c.id}" data-post-id="${postId}" data-comment-id="${c.id}" style="display: none; gap: 8px; margin-top: 8px;">
                    <input type="text" placeholder="Write a reply..." required style="flex:1; padding: 6px 10px; border-radius: 16px; border: 1px solid var(--color-border); background: var(--color-bg-primary); color: var(--color-text-main); font-size: 0.85rem;">
                    <button type="submit" class="btn btn-primary" style="padding: 6px 12px; border-radius: 16px; font-weight: 600; font-size: 0.85rem;">Reply</button>
                </form>
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
