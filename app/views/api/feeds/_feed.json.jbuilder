json.extract! feed, :id, :title, :favicon_url,
  :website_url, :description, :image_url, :status, :rss_url

# Safely handle social_links and website_links
json.social_links feed.try(:social_links) || []
json.website_links feed.try(:website_links) || []