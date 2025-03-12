// Global variables
let isLoggedIn = false;
const categories = ["English literature", "Littérature française", "الادب العربي", "for kids"];
let db; // تعريف المتغير db بشكل عام

// فتح قاعدة البيانات
const dbName = "BookStoreDB";
const dbVersion = 1;

const request = indexedDB.open(dbName, dbVersion);

request.onupgradeneeded = function(event) {
    db = event.target.result;
    // إنشاء Object Store إذا لم يكن موجودًا
    if (!db.objectStoreNames.contains("books")) {
        const objectStore = db.createObjectStore("books", { keyPath: "id", autoIncrement: true });
        objectStore.createIndex("title", "title", { unique: false });
        objectStore.createIndex("author", "author", { unique: false });
        objectStore.createIndex("price", "price", { unique: false });
        objectStore.createIndex("category", "category", { unique: false });
    }
};

request.onsuccess = function(event) {
    db = event.target.result;
    console.log("Database opened successfully!");
    loadBooks(); // جلب الكتب بعد فتح قاعدة البيانات
};

request.onerror = function(event) {
    console.error("Error opening database:", event.target.error);
};

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('bookImage').addEventListener('change', previewImage);

    // إضافة تأثيرات تفاعلية للأزرار
    document.querySelectorAll('.btn').forEach(button => {
        button.addEventListener('mouseenter', () => {
            button.style.transform = 'translateY(-2px)';
            button.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';
        });

        button.addEventListener('mouseleave', () => {
            button.style.transform = 'translateY(0)';
            button.style.boxShadow = 'none';
        });
    });
});

// Authentication Functions
async function handleLogin() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    const hashedPassword = await hashPassword(password);

    if (email === 'abbbisamir@gmail.com' && hashedPassword === await hashPassword('123')) {
        isLoggedIn = true;
        document.getElementById('loginSuccess').classList.remove('d-none');
        document.getElementById('addBookBtn').classList.remove('d-none');
        document.getElementById('loginBtn').classList.add('d-none');
        document.getElementById('logoutBtn').classList.remove('d-none');
        document.querySelectorAll('.delete-book-btn').forEach(btn => btn.classList.remove('d-none'));
        bootstrap.Modal.getInstance(document.getElementById('loginModal')).hide();
    } else {
        alert('❌ البريد الإلكتروني أو كلمة المرور غير صحيحة!');
    }
}

async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
}

function handleLogout() {
    isLoggedIn = false;
    document.getElementById('loginSuccess').classList.add('d-none');
    document.getElementById('addBookBtn').classList.add('d-none');
    document.getElementById('loginBtn').classList.remove('d-none');
    document.getElementById('logoutBtn').classList.add('d-none');
    document.querySelectorAll('.delete-book-btn').forEach(btn => btn.classList.add('d-none'));
}

// Book Management Functions
function previewImage(event) {
    const reader = new FileReader();
    reader.onload = function() {
        const preview = document.getElementById('imagePreview');
        preview.src = reader.result;
        preview.classList.remove('d-none');
    }
    reader.readAsDataURL(event.target.files[0]);
}

function handleAddBook() {
    const title = document.getElementById('bookTitle').value;
    const author = document.getElementById('bookAuthor').value;
    const shortSummary = document.getElementById('bookShortSummary').value;
    const longSummary = document.getElementById('bookLongSummary').value;
    const price = document.getElementById('bookPrice').value;
    const category = document.getElementById('bookCategory').value;
    const imageFile = document.getElementById('bookImage').files[0];

    if (!title || !author || !shortSummary || !longSummary || !price || !category || !imageFile) {
        Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'Please fill in all fields and select an image.',
        });
        return;
    }

    const reader = new FileReader();
    reader.onload = function() {
        const book = {
            title,
            author,
            shortSummary,
            longSummary,
            price: parseFloat(price),
            category,
            image: reader.result
        };

        const transaction = db.transaction("books", "readwrite");
        const store = transaction.objectStore("books");
        const request = store.add(book);

        request.onsuccess = function() {
            console.log("Book added successfully!");
            loadBooks(); // إعادة تحميل الكتب بعد الإضافة
            document.getElementById('addBookForm').reset();
            document.getElementById('imagePreview').classList.add('d-none');
            bootstrap.Modal.getInstance(document.getElementById('addBookModal')).hide();
            Swal.fire({
                icon: 'success',
                title: 'Book Added!',
                text: 'Your book has been successfully added.',
            });
        };

        request.onerror = function(event) {
            console.error("Error adding book:", event.target.error);
        };
    };
    reader.readAsDataURL(imageFile);
}

function deleteBook(id) {
    Swal.fire({
        title: 'Are you sure?',
        text: "You won't be able to revert this!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
        if (result.isConfirmed) {
            const transaction = db.transaction("books", "readwrite");
            const store = transaction.objectStore("books");
            const request = store.delete(id);

            request.onsuccess = function() {
                console.log("Book deleted successfully!");
                loadBooks(); // إعادة تحميل الكتب بعد الحذف
                Swal.fire(
                    'Deleted!',
                    'Your book has been deleted.',
                    'success'
                );
            };

            request.onerror = function(event) {
                console.error("Error deleting book:", event.target.error);
            };
        }
    });
}

function showBookDetails(book) {
    document.getElementById('bookDetailsTitle').textContent = book.title;
    document.getElementById('bookDetailsImage').src = book.image;
    document.getElementById('bookDetailsAuthor').textContent = book.author;
    document.getElementById('bookDetailsPrice').textContent = book.price;
    document.getElementById('bookDetailsCategory').textContent = book.category;
    document.getElementById('bookDetailsLongSummary').textContent = book.longSummary;
    new bootstrap.Modal(document.getElementById('bookDetailsModal')).show();
}

function loadBooks() {
    if (!db) {
        console.error("Database is not open yet!");
        return;
    }

    const loadingSpinner = document.getElementById('loadingSpinner');
    loadingSpinner.classList.remove('d-none');

    const transaction = db.transaction("books", "readonly");
    const store = transaction.objectStore("books");
    const request = store.getAll();

    request.onsuccess = function() {
        const books = request.result;
        const bookSections = document.getElementById('bookSections');
        bookSections.innerHTML = '';

        categories.forEach(category => {
            const categoryBooks = books.filter(book => book.category === category);
            if (categoryBooks.length === 0) return;

            const section = document.createElement('div');
            section.className = 'mb-5 animate__animated animate__fadeIn';
            section.innerHTML = `
                <h2 class="category-header mb-4 text-center animate__animated animate__flash animate__infinite animate__slower">${category}</h2>
                <div class="row row-cols-1 row-cols-md-2 row-cols-lg-4 g-4 ">
                    ${categoryBooks.map((book, index) => `
                        <div class="col">
                            <div class="card book-card h-100 animate__animated animate__zoomIn">
                                <img src="${book.image}" class="card-img-top book-image" alt="${book.title}" loading="lazy">
                                <div class="card-body">
                                    <h5 class="card-title">${book.title}</h5>
                                    <p class="card-text"><small class="text-muted">Author: ${book.author}</small></p>
                                    <p class="card-text">${book.shortSummary}</p>
                                    <p class="card-text text-success fw-bold">$${book.price}</p>
                                    <div class="d-flex gap-2">
                                        <button class="btn btn-primary" onclick='showBookDetails(${JSON.stringify(book)})' aria-label="Read more about ${book.title}">
                                            Read More
                                        </button>
                                        <button class="btn btn-danger delete-book-btn ${!isLoggedIn ? 'd-none' : ''}" 
                                                onclick="deleteBook(${book.id})" aria-label="Delete ${book.title}">
                                            <i class="bi bi-trash"></i>
                                        </button>
                                        <button class="btn btn-warning add-to-cart-btn" onclick="addToCart(${JSON.stringify(book)})" aria-label="Add ${book.title} to cart">
                                             Add to Cart
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
            bookSections.appendChild(section);
        });

        loadingSpinner.classList.add('d-none');
    };

    request.onerror = function(event) {
        console.error("Error loading books:", event.target.error);
    };
}

function searchBooks() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const transaction = db.transaction("books", "readonly");
    const store = transaction.objectStore("books");
    const request = store.getAll();

    request.onsuccess = function() {
        const books = request.result;
        const filteredBooks = books.filter(book => 
            book.title.toLowerCase().includes(searchTerm) || 
            book.author.toLowerCase().includes(searchTerm)
        );

        const bookSections = document.getElementById('bookSections');
        bookSections.innerHTML = '';

        if (filteredBooks.length === 0) {
            bookSections.innerHTML = '<p>No books found.</p>';
            return;
        }

        const section = document.createElement('div');
        section.className = 'mb-5';
        section.innerHTML = `
            <div class="row row-cols-1 row-cols-md-2 row-cols-lg-4 g-4">
                ${filteredBooks.map((book, index) => `
                    <div class="col">
                        <div class="card book-card h-100">
                            <img src="${book.image}" class="card-img-top book-image" alt="${book.title}" loading="lazy">
                            <div class="card-body">
                                <h5 class="card-title">${book.title}</h5>
                                <p class="card-text"><small class="text-muted">Author: ${book.author}</small></p>
                                <p class="card-text">${book.shortSummary}</p>
                                <p class="card-text text-success fw-bold">$${book.price}</p>
                                <div class="d-flex gap-2">
                                    <button class="btn btn-primary" onclick='showBookDetails(${JSON.stringify(book)})' aria-label="Read more about ${book.title}">
                                        Read More
                                    </button>
                                    <button class="btn btn-danger delete-book-btn ${!isLoggedIn ? 'd-none' : ''}" 
                                            onclick="deleteBook(${book.id})" aria-label="Delete ${book.title}">
                                        <i class="bi bi-trash"></i>
                                    </button>
                                        </button>
                                        <button class="btn btn-warning add-to-cart-btn" onclick="addToCart(${JSON.stringify(book)})" aria-label="Add ${book.title} to cart">
                                             Add to Cart
                                        </button>
                                </div>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        bookSections.appendChild(section);
    };

    request.onerror = function(event) {
        console.error("Error loading books:", event.target.error);
    };
}

let cart = [];

function addToCart(book) {
    // تحقق مما إذا كان الكتاب موجودًا بالفعل في السلة
    const bookExists = cart.some(item => item.id === book.id);
    
    if (bookExists) {
        Swal.fire({
            icon: 'info',
            title: 'موجود بالفعل!',
            text: `${book.title} موجود بالفعل في السلة.`,
        });
        return; // الخروج إذا كان الكتاب موجودًا
    }

    cart.push(book); // إضافة الكتاب للسلة
    updateCartUI(); // تحديث واجهة المستخدم للسلة

    Swal.fire({
        icon: 'success',
        title: 'تمت الإضافة!',
        text: `${book.title} أُضيف إلى السلة.`,
    });
}

function updateCartUI() {
    const cartCount = document.getElementById('cartCount');
    if (cartCount) {
        cartCount.textContent = cart.length;
        localStorage.setItem('cart', JSON.stringify(cart)); // حفظ السلة في localStorage
    }
}

function showCartModal() {
    const cartItemsList = document.getElementById('cartItemsList');
    const cartTotal = document.getElementById('cartTotal');
    let total = 0;

    cartItemsList.innerHTML = '';
    cart.forEach((book, index) => {
        const li = document.createElement('li');
        li.textContent = `${book.title} - $${book.price}`;
        
        const removeButton = document.createElement('button');
        removeButton.textContent = 'Remove';
        removeButton.className = 'btn btn-danger btn-sm ms-2';
        removeButton.onclick = () => removeFromCart(index);
        
        li.appendChild(removeButton);
        cartItemsList.appendChild(li);
        total += book.price;
    });

    cartTotal.textContent = total.toFixed(2);
    new bootstrap.Modal(document.getElementById('confirmPurchaseModal')).show();
}

function removeFromCart(index) {
    cart.splice(index, 1);
    updateCartUI();
    showCartModal(); // Refresh the modal
}

function confirmPurchase() {
    Swal.fire({
        title: 'Purchase Confirmed!',
        text: `Thank you for purchasing ${cart.length} items.`,
        icon: 'success',
    }).then(() => {
        cart = []; // Clear the cart
        updateCartUI();
        bootstrap.Modal.getInstance(document.getElementById('confirmPurchaseModal')).hide();
    });
}