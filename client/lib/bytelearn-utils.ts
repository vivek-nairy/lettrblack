import { db } from "./firebase";
import { collection, getDocs, query, orderBy, limit, where, doc, updateDoc, increment, getDoc } from "firebase/firestore";

export interface ByteLearnVideo {
  videoId: string;
  subject: string;
  grade: string;
  title: string;
  videoURL: string;
  thumbnail: string;
  xpReward: number;
  description?: string;
  duration?: number;
  likes?: number;
  comments?: number;
  views?: number;
  creator?: {
    name: string;
    avatar: string;
  };
  createdAt?: number;
  updatedAt?: number;
}

/**
 * Fetch ByteLearn videos from Firebase
 */
export async function fetchByteLearnVideos(
  subject?: string,
  grade?: string,
  limitCount: number = 50
): Promise<ByteLearnVideo[]> {
  try {
    let videosQuery = query(
      collection(db, "ByteLearnVideos"),
      orderBy("createdAt", "desc"),
      limit(limitCount)
    );

    // Add subject filter if provided
    if (subject && subject !== "all") {
      videosQuery = query(videosQuery, where("subject", "==", subject));
    }

    // Add grade filter if provided
    if (grade) {
      videosQuery = query(videosQuery, where("grade", "==", grade));
    }

    const snapshot = await getDocs(videosQuery);
    const videos: ByteLearnVideo[] = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      videos.push({
        videoId: doc.id,
        ...data,
      } as ByteLearnVideo);
    });

    return videos;
  } catch (error) {
    console.error("Error fetching ByteLearn videos:", error);
    throw error;
  }
}

/**
 * Update video likes count
 */
export async function updateVideoLikes(videoId: string, incrementBy: number = 1): Promise<void> {
  try {
    const videoRef = doc(db, "ByteLearnVideos", videoId);
    await updateDoc(videoRef, {
      likes: increment(incrementBy),
      updatedAt: Date.now(),
    });
  } catch (error) {
    console.error("Error updating video likes:", error);
    throw error;
  }
}

/**
 * Update video views count
 */
export async function updateVideoViews(videoId: string): Promise<void> {
  try {
    const videoRef = doc(db, "ByteLearnVideos", videoId);
    await updateDoc(videoRef, {
      views: increment(1),
      updatedAt: Date.now(),
    });
  } catch (error) {
    console.error("Error updating video views:", error);
    throw error;
  }
}

/**
 * Update video comments count
 */
export async function updateVideoComments(videoId: string, incrementBy: number = 1): Promise<void> {
  try {
    const videoRef = doc(db, "ByteLearnVideos", videoId);
    await updateDoc(videoRef, {
      comments: increment(incrementBy),
      updatedAt: Date.now(),
    });
  } catch (error) {
    console.error("Error updating video comments:", error);
    throw error;
  }
}

/**
 * Get video by ID
 */
export async function getVideoById(videoId: string): Promise<ByteLearnVideo | null> {
  try {
    const videoRef = doc(db, "ByteLearnVideos", videoId);
    const videoDoc = await getDoc(videoRef);
    
    if (videoDoc.exists()) {
      return {
        videoId: videoDoc.id,
        ...videoDoc.data(),
      } as ByteLearnVideo;
    }
    
    return null;
  } catch (error) {
    console.error("Error fetching video by ID:", error);
    throw error;
  }
}

/**
 * Get trending videos (most viewed in last 7 days)
 */
export async function getTrendingVideos(limitCount: number = 20): Promise<ByteLearnVideo[]> {
  try {
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    
    const videosQuery = query(
      collection(db, "ByteLearnVideos"),
      where("createdAt", ">=", sevenDaysAgo),
      orderBy("views", "desc"),
      limit(limitCount)
    );

    const snapshot = await getDocs(videosQuery);
    const videos: ByteLearnVideo[] = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      videos.push({
        videoId: doc.id,
        ...data,
      } as ByteLearnVideo);
    });

    return videos;
  } catch (error) {
    console.error("Error fetching trending videos:", error);
    throw error;
  }
}

/**
 * Get videos by subject
 */
export async function getVideosBySubject(subject: string, limitCount: number = 20): Promise<ByteLearnVideo[]> {
  try {
    const videosQuery = query(
      collection(db, "ByteLearnVideos"),
      where("subject", "==", subject),
      orderBy("createdAt", "desc"),
      limit(limitCount)
    );

    const snapshot = await getDocs(videosQuery);
    const videos: ByteLearnVideo[] = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      videos.push({
        videoId: doc.id,
        ...data,
      } as ByteLearnVideo);
    });

    return videos;
  } catch (error) {
    console.error("Error fetching videos by subject:", error);
    throw error;
  }
} 