export const handleUploadError = (error: Error): string => {
  console.error('Upload error:', error);

  // Show user-friendly error messages
  if (error.message.includes('File size')) {
    return 'File is too large. Please choose a smaller file.';
  }
  
  if (error.message.includes('File type')) {
    return 'File type not supported. Please choose a different file format.';
  }
  
  if (error.message.includes('dimensions')) {
    return 'Image dimensions are too large. Please resize the image.';
  }
  
  if (error.message.includes('Network')) {
    return 'Network error. Please check your connection and try again.';
  }
  
  if (error.message.includes('timeout')) {
    return 'Upload timed out. Please try again with a smaller file.';
  }

  return 'Upload failed. Please try again.';
};