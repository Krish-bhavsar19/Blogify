window.addEventListener('scroll', function () {
            const navbar = document.querySelector('.navbar');
            if (window.scrollY > 50) {
                navbar.style.background = 'rgba(255, 255, 255, 0.98)';
            } else {
                navbar.style.background = 'rgba(255, 255, 255, 0.95)';
            }
        });

        // Like button functionality
        function updateLikeUI(btn, liked, count) {
            const icon = btn.querySelector('i');
            const countSpan = btn.querySelector('.like-count');

            if (liked) {
                icon.classList.add('text-danger');
                icon.classList.remove('text-muted');
            } else {
                icon.classList.remove('text-danger');
                icon.classList.add('text-muted');
            }

            if (countSpan) {
                countSpan.textContent = count;
            }
        }

        
        document.addEventListener('DOMContentLoaded', function () {
            const likeBtn = document.querySelector('.like-btn');
            if (likeBtn && likeBtn.getAttribute('data-post-id')) {
                const postId = likeBtn.getAttribute('data-post-id');

               
                fetch(`/posts/${postId}/like-status`, {
                    method: 'GET',
                    credentials: 'same-origin',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    }
                })
                    .then(res => res.json())
                    .then(data => {
                        if (data && typeof data.isLiked !== 'undefined' && typeof data.likes !== 'undefined') {
                            updateLikeUI(likeBtn, data.isLiked, data.likes);
                        }
                    })
                    .catch(error => {
                        console.error('Error fetching like status:', error);
                    });

            
                likeBtn.addEventListener('click', function (e) {
                    e.preventDefault();

                    fetch(`/posts/${postId}/like`, {
                        method: 'POST',
                        credentials: 'same-origin',
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json'
                        }
                    })
                        .then(res => res.json())
                        .then(data => {
                            if (typeof data.likes !== 'undefined') {
                                const liked = this.querySelector('i').classList.contains('text-muted');
                                updateLikeUI(this, liked, data.likes);
                            }
                        })
                        .catch(error => {
                            console.error('Error:', error);
                        });
                });
            }
        });

      
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });

       
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver(function (entries) {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, observerOptions);

        document.addEventListener('DOMContentLoaded', function () {
            const animatedElements = document.querySelectorAll('.post-card, .comment-item');

            animatedElements.forEach(el => {
                el.style.opacity = '0';
                el.style.transform = 'translateY(20px)';
                el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
                observer.observe(el);
            });
        });

        // Share button
        function sharePost() {
            if (navigator.share) {
                navigator.share({
                    title: document.title,
                    text: "Check out this post!",
                    url: window.location.href
                }).catch(err => console.error('Share failed:', err));
            } else {
                navigator.clipboard.writeText(window.location.href)
                    .then(() => alert("Link copied to clipboard!"))
                    .catch(() => alert("Copy failed. Please copy manually."));
            }
        }