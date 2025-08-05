import { fetchCollections, fetchCollectionsWithFeedsAndSocialMediaProfiles, removeCollectionItem, addCollectionItem } from '../util/collections_api_util';
// Remove an item (feed or social profile) from a collection
export const removeCollectionItemAction = (collectionId, itemType, itemId) => async (dispatch) => {
  try {
    const result = await removeCollectionItem(collectionId, itemType, itemId);
    // Optionally, you can refetch collections or optimistically update state here
    if (typeof window !== 'undefined') window.dispatchEvent(new Event('refresh-navbar-folders'));
    return result;
  } catch (err) {
    dispatch(collectionsError(err.message));
    throw err;
  }
};

// Add an item (feed or social profile) to a collection
export const addCollectionItemAction = (collectionId, itemType, itemId) => async (dispatch) => {
  try {
    const result = await addCollectionItem(collectionId, itemType, itemId);
    // Optionally, you can refetch collections or optimistically update state here
    if (typeof window !== 'undefined') window.dispatchEvent(new Event('refresh-navbar-folders'));
    return result;
  } catch (err) {
    dispatch(collectionsError(err.message));
    throw err;
  }
};

export const RECEIVE_COLLECTIONS = 'RECEIVE_COLLECTIONS';
export const COLLECTIONS_ERROR = 'COLLECTIONS_ERROR';

export const receiveCollections = (collections) => ({
  type: RECEIVE_COLLECTIONS,
  collections
});

export const collectionsError = (error) => ({
  type: COLLECTIONS_ERROR,
  error
});

// Fetch all collections (basic)
export const fetchCollectionsAction = () => async (dispatch) => {
  try {
    const collections = await fetchCollections();
    dispatch(receiveCollections(collections));
    return collections;
  } catch (err) {
    dispatch(collectionsError(err.message));
    throw err;
  }
};

// Fetch collections with feeds and social media profiles
export const fetchCollectionsWithFeedsAndSocialMediaProfilesAction = () => async (dispatch) => {
  try {
    const collections = await fetchCollectionsWithFeedsAndSocialMediaProfiles();
    dispatch(receiveCollections(collections));
    return collections;
  } catch (err) {
    dispatch(collectionsError(err.message));
    throw err;
  }
};
