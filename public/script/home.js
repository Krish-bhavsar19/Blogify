const loader = document.getElementById('loader');
                const pageContent = document.getElementById('pageContent');
                const progressBar = document.getElementById('progressBar');
                const subText = document.getElementById('loadingSubText');

                const loadingMessages = [
                    'Initializing Experience',
                    'Loading Resources',
                    'Optimizing Performance',
                    'Preparing Interface',
                    'Almost Ready'
                ];

                let currentMessage = 0;
                let progress = 0;

                function updateProgress() {
                    const increment = Math.random() * 15 + 5;
                    progress = Math.min(progress + increment, 100);

                    progressBar.style.width = progress + '%';

                    const messageIndex = Math.floor((progress / 100) * loadingMessages.length);
                    if (messageIndex !== currentMessage && messageIndex < loadingMessages.length) {
                        currentMessage = messageIndex;
                        subText.style.opacity = '0';
                        setTimeout(() => {
                            subText.textContent = loadingMessages[currentMessage];
                            subText.style.opacity = '1';
                        }, 200);
                    }

                    if (progress < 100) {
                        setTimeout(updateProgress, Math.random() * 300 + 200);
                    } else {
                        setTimeout(hideLoader, 500);
                    }
                }

                function hideLoader() {
                    document.body.style.overflow = 'auto';

                    loader.classList.add('hidden');

                    setTimeout(() => {
                        pageContent.classList.add('loaded');
                    }, 300);
                }

                setTimeout(updateProgress, 500);

                setTimeout(hideLoader, 8000);

                window.addEventListener('load', () => {
                    if (progress < 90) {
                        progress = 90;
                    }
                });

                document.addEventListener('mousemove', (e) => {
                    const particles = document.querySelectorAll('.particle');
                    const mouseX = e.clientX / window.innerWidth;
                    const mouseY = e.clientY / window.innerHeight;

                    particles.forEach((particle, index) => {
                        const speed = (index + 1) * 0.5;
                        const x = mouseX * speed;
                        const y = mouseY * speed;

                        particle.style.transform = `translate(${x}px, ${y}px)`;
                    });
                });


                //navigation links
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

                // Navbar background
                window.addEventListener('scroll', function () {
                    const navbar = document.querySelector('.navbar');
                    if (window.scrollY > 50) {
                        navbar.style.background = 'rgba(255, 255, 255, 0.98)';
                    } else {
                        navbar.style.background = 'rgba(255, 255, 255, 0.95)';
                    }
                });

                // LikeUnlike functionality
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
                    countSpan.textContent = count;
                }
                document.querySelectorAll('.like-btn').forEach(btn => {
                    btn.addEventListener('click', function (e) {
                        e.preventDefault();
                        const postId = this.getAttribute('data-post-id');
                        const isLoggedIn = this.dataset.loggedIn === "true";

                        if (!isLoggedIn) {
                            window.location.href = "/user/login";
                            return;
                        }
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
                            });
                    });
                });

                // Welcome popup
                document.addEventListener('DOMContentLoaded', function () {
                    const popup = document.getElementById('welcome-popup');
                    if (popup) {
                        if (!sessionStorage.getItem('welcomePopupShown')) {
                            setTimeout(() => {
                                popup.classList.add('show');
                            }, 200);
                            setTimeout(() => {
                                popup.classList.remove('show');
                                popup.classList.add('hide');
                            }, 3700);
                            popup.addEventListener('transitionend', function () {
                                if (popup.classList.contains('hide')) {
                                    popup.parentNode.removeChild(popup);
                                }
                            });
                            sessionStorage.setItem('welcomePopupShown', 'true');
                        } else {
                            popup.parentNode.removeChild(popup);
                        }
                    }
                });

                //notification
                document.addEventListener('DOMContentLoaded', function () {
                    var notificationDropdown = document.getElementById('notificationDropdown');
                    var markAllReadBtn = document.getElementById('markAllReadBtn');

                    if (notificationDropdown) {
                        notificationDropdown.addEventListener('click', function (e) {
                            e.preventDefault();
                        });


                        notificationDropdown.addEventListener('show.bs.dropdown', function () {
                            fetch('/user/notifications/mark-all-read', { method: 'POST' })
                                .then(res => res.json())
                                .then(data => {
                                    if (data.success) {

                                        const badge = document.getElementById('notificationBadge');
                                        if (badge) badge.remove();

                                    }
                                });
                        });
                    }

                    if (markAllReadBtn) {
                        markAllReadBtn.addEventListener('click', function (e) {
                            e.preventDefault();
                            fetch('/user/notifications/mark-all-read', { method: 'POST' })
                                .then(res => res.json())
                                .then(data => {
                                    if (data.success) {
                                        location.reload();
                                    }
                                });
                        });
                    }
                });