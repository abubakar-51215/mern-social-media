// Utility functions for cross-platform sharing

/**
 * Generate a rich preview link for sharing
 * @param {Object} post - The post object
 * @returns {string} - Formatted text with preview
 */
export const generateShareText = (post) => {
  const postUrl = `${window.location.origin}/post/${post._id}`;
  const userName = post.user?.name || 'Unknown User';
  const content = post.content || '';
  
  return `Check out this post by ${userName}:\n\n${content}\n\n${postUrl}`;
};

/**
 * Copy link with rich preview to clipboard
 * @param {Object} post - The post object
 * @param {Function} onSuccess - Success callback
 * @param {Function} onError - Error callback
 */
export const copyLinkWithPreview = async (post, onSuccess, onError) => {
  try {
    const shareText = generateShareText(post);
    await navigator.clipboard.writeText(shareText);
    
    if (onSuccess) onSuccess();
  } catch (err) {
    console.error('Failed to copy link:', err);
    if (onError) onError(err);
  }
};

/**
 * Share to Twitter/X
 * @param {Object} post - The post object
 */
export const shareToTwitter = (post) => {
  const postUrl = `${window.location.origin}/post/${post._id}`;
  const text = post.content.substring(0, 200) + (post.content.length > 200 ? '...' : '');
  const encodedText = encodeURIComponent(text);
  const encodedUrl = encodeURIComponent(postUrl);
  
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`;
  window.open(twitterUrl, '_blank', 'width=550,height=420,scrollbars=yes');
};

/**
 * Share to Facebook
 * @param {Object} post - The post object
 */
export const shareToFacebook = (post) => {
  const postUrl = `${window.location.origin}/post/${post._id}`;
  const encodedUrl = encodeURIComponent(postUrl);
  
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
  window.open(facebookUrl, '_blank', 'width=550,height=420,scrollbars=yes');
};

/**
 * Share to LinkedIn
 * @param {Object} post - The post object
 */
export const shareToLinkedIn = (post) => {
  const postUrl = `${window.location.origin}/post/${post._id}`;
  const encodedUrl = encodeURIComponent(postUrl);
  
  const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
  window.open(linkedInUrl, '_blank', 'width=550,height=420,scrollbars=yes');
};

/**
 * Share to WhatsApp
 * @param {Object} post - The post object
 */
export const shareToWhatsApp = (post) => {
  const shareText = generateShareText(post);
  const encodedText = encodeURIComponent(shareText);
  
  // Check if mobile
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const whatsappUrl = isMobile 
    ? `whatsapp://send?text=${encodedText}`
    : `https://web.whatsapp.com/send?text=${encodedText}`;
  
  window.open(whatsappUrl, '_blank');
};

/**
 * Share to Instagram (Note: Instagram doesn't support direct web sharing)
 * This will copy the text and open Instagram
 * @param {Object} post - The post object
 */
export const shareToInstagram = async (post) => {
  const shareText = generateShareText(post);
  
  try {
    await navigator.clipboard.writeText(shareText);
    alert('Post content copied! Open Instagram and paste it in a new post or story.');
    // Open Instagram in new tab
    window.open('https://www.instagram.com/', '_blank');
  } catch (err) {
    alert('Please copy the post content manually and share it on Instagram.');
  }
};

/**
 * Native share (uses Web Share API if available)
 * @param {Object} post - The post object
 * @param {Function} onFallback - Fallback function if native share not available
 */
export const nativeShare = async (post, onFallback) => {
  if (navigator.share) {
    try {
      const postUrl = `${window.location.origin}/post/${post._id}`;
      await navigator.share({
        title: `${post.user?.name || 'User'}'s post`,
        text: post.content,
        url: postUrl
      });
    } catch (err) {
      // User cancelled or error occurred
      console.log('Share cancelled or failed:', err);
    }
  } else {
    // Fallback to copy link
    if (onFallback) onFallback();
  }
};

/**
 * Generate Open Graph meta tags for SEO and rich previews
 * @param {Object} post - The post object
 * @returns {Object} - Meta tags object
 */
export const generateOGMetaTags = (post) => {
  const postUrl = `${window.location.origin}/post/${post._id}`;
  const userName = post.user?.name || 'Unknown User';
  const description = post.content.substring(0, 160) + (post.content.length > 160 ? '...' : '');
  const image = post.images?.[0] || post.user?.profilePicture || '';
  
  return {
    'og:title': `${userName}'s post`,
    'og:description': description,
    'og:url': postUrl,
    'og:type': 'article',
    'og:image': image,
    'twitter:card': 'summary_large_image',
    'twitter:title': `${userName}'s post`,
    'twitter:description': description,
    'twitter:image': image,
  };
};

export default {
  generateShareText,
  copyLinkWithPreview,
  shareToTwitter,
  shareToFacebook,
  shareToLinkedIn,
  shareToWhatsApp,
  shareToInstagram,
  nativeShare,
  generateOGMetaTags,
};
