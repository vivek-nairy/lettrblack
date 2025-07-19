import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import {
  ShoppingCart,
  Filter,
  Star,
  Download,
  BookOpen,
  Video,
  FileText,
  Plus,
  Minus,
  X,
  Tag,
  Heart,
  Eye,
  Search,
  SortDesc,
  User,
  Check,
  CreditCard,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useNavigate } from "react-router-dom";

const categories = [
  { id: "all", name: "All Categories", icon: BookOpen },
  { id: "Courses", name: "Courses", icon: Video },
  { id: "Ebooks", name: "Ebooks", icon: BookOpen },
  { id: "Notes", name: "Notes", icon: FileText },
];

const subjects = [
  "All Subjects",
  "Programming",
  "Mathematics",
  "Data Science",
  "Language",
  "Science",
];

const priceFilters = [
  { id: "all", name: "All Prices" },
  { id: "free", name: "Free" },
  { id: "paid", name: "Paid" },
];

const sortOptions = [
  { id: "newest", name: "Newest" },
  { id: "popular", name: "Most Popular" },
  { id: "rating", name: "Top Rated" },
  { id: "price-low", name: "Price: Low to High" },
  { id: "price-high", name: "Price: High to Low" },
];

interface CartItem {
  id: number;
  title: string;
  price: number;
  creator: string;
  thumbnail: string;
  quantity: number;
}

export function Marketplace() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  useEffect(() => {
    getDocs(collection(db, "products")).then(snap => setProducts(snap.docs.map(doc => doc.data())));
  }, []);

  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedSubject, setSelectedSubject] = useState("All Subjects");
  const [selectedPrice, setSelectedPrice] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [wishlist, setWishlist] = useState<number[]>([]);

  const filteredProducts = products
    .filter((product) => {
      const matchesSearch =
        product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory =
        selectedCategory === "all" || product.category === selectedCategory;
      const matchesSubject =
        selectedSubject === "All Subjects" ||
        product.subject === selectedSubject;
      const matchesPrice =
        selectedPrice === "all" ||
        (selectedPrice === "free" && product.price === 0) ||
        (selectedPrice === "paid" && product.price > 0);
      return matchesSearch && matchesCategory && matchesSubject && matchesPrice;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "popular":
          return b.views - a.views;
        case "rating":
          return b.rating - a.rating;
        case "price-low":
          return a.price - b.price;
        case "price-high":
          return b.price - a.price;
        default:
          return b.id - a.id; // newest first
      }
    });

  const addToCart = (product: any) => {
    const existingItem = cart.find((item) => item.id === product.id);
    if (existingItem) {
      setCart(
        cart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        ),
      );
    } else {
      setCart([
        ...cart,
        {
          id: product.id,
          title: product.title,
          price: product.price,
          creator: product.creator,
          thumbnail: product.thumbnail,
          quantity: 1,
        },
      ]);
    }
  };

  const removeFromCart = (productId: number) => {
    setCart(cart.filter((item) => item.id !== productId));
  };

  const updateQuantity = (productId: number, newQuantity: number) => {
    if (newQuantity === 0) {
      removeFromCart(productId);
    } else {
      setCart(
        cart.map((item) =>
          item.id === productId ? { ...item, quantity: newQuantity } : item,
        ),
      );
    }
  };

  const toggleWishlist = (productId: number) => {
    setWishlist((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId],
    );
  };

  const cartTotal = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0,
  );
  const cartItemCount = cart.reduce((total, item) => total + item.quantity, 0);

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={cn(
          "w-4 h-4",
          i < Math.floor(rating)
            ? "text-yellow-400 fill-current"
            : "text-gray-400",
        )}
      />
    ));
  };

  return (
    <Layout>
      <div className="space-y-6 relative">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Marketplace
            </h1>
            <p className="text-muted-foreground">
              Discover premium educational resources
            </p>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowCart(true)}
              className="relative p-3 bg-card border border-border rounded-xl hover:bg-muted transition-colors"
            >
              <ShoppingCart className="w-6 h-6 text-foreground" />
              {cartItemCount > 0 && (
                <span className="absolute -top-2 -right-2 w-6 h-6 bg-primary text-primary-foreground rounded-full text-xs font-bold flex items-center justify-center">
                  {cartItemCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search courses, ebooks, and notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring text-foreground placeholder:text-muted-foreground"
          />
        </div>

        {/* Filters */}
        <div className="lettrblack-card p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Categories */}
            <div className="flex-1">
              <label className="text-sm font-medium text-foreground mb-2 block">
                Category
              </label>
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors",
                      selectedCategory === category.id
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-secondary text-secondary-foreground border-border hover:bg-secondary/80",
                    )}
                  >
                    <category.icon className="w-4 h-4" />
                    {category.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Subject */}
            <div className="lg:w-48">
              <label className="text-sm font-medium text-foreground mb-2 block">
                Subject
              </label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full p-2 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {subjects.map((subject) => (
                  <option key={subject} value={subject}>
                    {subject}
                  </option>
                ))}
              </select>
            </div>

            {/* Price */}
            <div className="lg:w-32">
              <label className="text-sm font-medium text-foreground mb-2 block">
                Price
              </label>
              <select
                value={selectedPrice}
                onChange={(e) => setSelectedPrice(e.target.value)}
                className="w-full p-2 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {priceFilters.map((filter) => (
                  <option key={filter.id} value={filter.id}>
                    {filter.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort */}
            <div className="lg:w-48">
              <label className="text-sm font-medium text-foreground mb-2 block">
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full p-2 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {sortOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="lettrblack-card group hover:scale-105 transition-all duration-300 cursor-pointer overflow-hidden"
              >
                {/* Thumbnail */}
                <div className="relative">
                  <img
                    src={product.thumbnail}
                    alt={product.title}
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

                  {/* Badges */}
                  <div className="absolute top-3 left-3 flex gap-2">
                    {product.isNew && (
                      <span className="px-2 py-1 bg-primary text-primary-foreground text-xs font-bold rounded-full">
                        NEW
                      </span>
                    )}
                    {product.isBestseller && (
                      <span className="px-2 py-1 bg-yellow-500 text-white text-xs font-bold rounded-full">
                        BESTSELLER
                      </span>
                    )}
                    {product.price === 0 && (
                      <span className="px-2 py-1 bg-green-500 text-white text-xs font-bold rounded-full">
                        FREE
                      </span>
                    )}
                  </div>

                  {/* Wishlist */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleWishlist(product.id);
                    }}
                    className="absolute top-3 right-3 p-2 bg-black/50 backdrop-blur-sm rounded-full transition-colors hover:bg-black/70"
                  >
                    <Heart
                      className={cn(
                        "w-4 h-4",
                        wishlist.includes(product.id)
                          ? "text-red-400 fill-current"
                          : "text-white",
                      )}
                    />
                  </button>

                  {/* Stats */}
                  <div className="absolute bottom-3 left-3 flex items-center gap-3 text-white text-xs">
                    <div className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {product.views.toLocaleString()}
                    </div>
                    <div className="flex items-center gap-1">
                      <Heart className="w-3 h-3" />
                      {product.likes}
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 space-y-3">
                  <h3 className="font-semibold text-foreground text-lg leading-tight line-clamp-2">
                    {product.title}
                  </h3>

                  <p className="text-muted-foreground text-sm line-clamp-2">
                    {product.description}
                  </p>

                  {/* Creator */}
                  <div className="flex items-center gap-2">
                    <img
                      src={product.creatorAvatar}
                      alt={product.creator}
                      className="w-6 h-6 rounded-full object-cover"
                    />
                    <span className="text-sm text-muted-foreground">
                      {product.creator}
                    </span>
                  </div>

                  {/* Rating */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      {renderStars(product.rating)}
                    </div>
                    <span className="text-sm font-medium text-foreground">
                      {product.rating}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      ({product.reviewCount} reviews)
                    </span>
                  </div>

                  {/* Price & Actions */}
                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-2">
                      {product.price === 0 ? (
                        <span className="text-xl font-bold text-green-400">
                          Free
                        </span>
                      ) : (
                        <>
                          <span className="text-xl font-bold text-primary">
                            ${product.price}
                          </span>
                          {product.originalPrice && (
                            <span className="text-sm text-muted-foreground line-through">
                              ${product.originalPrice}
                            </span>
                          )}
                        </>
                      )}
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        addToCart(product);
                      }}
                      className="lettrblack-button text-sm flex items-center gap-1"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      Add to Cart
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Empty State
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <BookOpen className="w-12 h-12 text-primary" />
            </div>
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              No resources found
            </h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Try adjusting your search terms or filters to find the educational
              resources you're looking for.
            </p>
            <button
              onClick={() => {
                setSearchTerm("");
                setSelectedCategory("all");
                setSelectedSubject("All Subjects");
                setSelectedPrice("all");
              }}
              className="lettrblack-button"
            >
              Clear Filters
            </button>
          </div>
        )}

        {/* Cart Sidebar */}
        {showCart && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-end">
            <div className="w-full max-w-md bg-card border-l border-border h-full overflow-y-auto">
              {/* Cart Header */}
              <div className="flex items-center justify-between p-6 border-b border-border">
                <h2 className="text-xl font-semibold text-foreground">
                  Shopping Cart
                </h2>
                <button
                  onClick={() => setShowCart(false)}
                  className="p-2 hover:bg-muted rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Cart Items */}
              <div className="p-6 space-y-4">
                {cart.length === 0 ? (
                  <div className="text-center py-8">
                    <ShoppingCart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Your cart is empty</p>
                  </div>
                ) : (
                  <>
                    {cart.map((item) => (
                      <div
                        key={item.id}
                        className="flex gap-3 p-3 bg-muted/30 rounded-lg"
                      >
                        <img
                          src={item.thumbnail}
                          alt={item.title}
                          className="w-16 h-16 object-cover rounded"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-foreground text-sm line-clamp-2">
                            {item.title}
                          </h4>
                          <p className="text-xs text-muted-foreground">
                            {item.creator}
                          </p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="font-bold text-primary">
                              $
                              {item.price === 0
                                ? "Free"
                                : (item.price * item.quantity).toFixed(2)}
                            </span>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() =>
                                  updateQuantity(item.id, item.quantity - 1)
                                }
                                className="p-1 hover:bg-muted rounded"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="text-sm font-medium w-8 text-center">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() =>
                                  updateQuantity(item.id, item.quantity + 1)
                                }
                                className="p-1 hover:bg-muted rounded"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => removeFromCart(item.id)}
                                className="p-1 hover:bg-muted rounded text-red-400"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Cart Total */}
                    <div className="border-t border-border pt-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-foreground">
                          Total:
                        </span>
                        <span className="text-xl font-bold text-primary">
                          ${cartTotal.toFixed(2)}
                        </span>
                      </div>
                      <button
                        onClick={() => navigate('/checkout')}
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                      >
                        <CreditCard className="w-5 h-5" />
                        Checkout
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
