# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# Note that this schema.rb definition is the authoritative source for your
# database schema. If you need to create the application database on another
# system, you should be using db:schema:load, not running all the migrations
# from scratch. The latter is a flawed and unsustainable approach (the more migrations
# you'll amass, the slower it'll run and the greater likelihood for issues).
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema.define(version: 2025_07_28_120000) do

  # These are extensions that must be enabled in order to support this database
  enable_extension "plpgsql"

  create_table "collection_assignments", force: :cascade do |t|
    t.integer "subscription_id"
    t.integer "collection_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["subscription_id", "collection_id"], name: "index_collection_assignments_on_sub_id_and_coll_id", unique: true
  end

  create_table "collection_items", force: :cascade do |t|
    t.integer "collection_id"
    t.integer "item_id"
    t.string "item_type"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  create_table "collections", force: :cascade do |t|
    t.string "name"
    t.integer "creator_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["creator_id", "name"], name: "index_collections_on_creator_id_and_name", unique: true
  end

  create_table "feeds", force: :cascade do |t|
    t.string "title", default: "", null: false
    t.string "rss_url", null: false
    t.string "description", default: "", null: false
    t.string "favicon_url", default: "", null: false
    t.string "image_url", default: ""
    t.string "website_url", default: "", null: false
    t.datetime "last_built", default: "2025-07-28 12:36:10", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "status", default: "OK"
    t.integer "subscriptions_count", default: 0
    t.text "keywords"
    t.text "rss_feeds"
    t.text "social_links", default: [], array: true
    t.text "website_links", default: [], array: true
    t.index ["rss_url"], name: "index_feeds_on_rss_url", unique: true
    t.index ["title"], name: "index_feeds_on_title"
  end

  create_table "reads", force: :cascade do |t|
    t.integer "reader_id"
    t.integer "story_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["reader_id", "story_id"], name: "index_reads_on_reader_id_and_story_id", unique: true
  end

  create_table "social_media_markeds", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.bigint "social_media_profile_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["social_media_profile_id"], name: "index_social_media_markeds_on_social_media_profile_id"
    t.index ["user_id", "social_media_profile_id"], name: "index_social_media_markeds_on_user_and_profile", unique: true
    t.index ["user_id"], name: "index_social_media_markeds_on_user_id"
  end

  create_table "social_media_profiles", force: :cascade do |t|
    t.string "platform", null: false
    t.string "username", null: false
    t.string "display_name"
    t.string "profile_url"
    t.string "avatar_url"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["platform", "username"], name: "index_social_media_profiles_on_platform_and_username", unique: true
  end

  create_table "stories", force: :cascade do |t|
    t.string "entry_id"
    t.string "title"
    t.string "author"
    t.string "summary"
    t.string "link_url"
    t.string "image_url"
    t.integer "feed_id", null: false
    t.datetime "pub_datetime"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "teaser", default: "Continue reading..."
    t.text "content"
    t.index ["feed_id", "entry_id"], name: "index_stories_on_feed_id_and_entry_id", unique: true
  end

  create_table "subscriptions", force: :cascade do |t|
    t.integer "subscriber_id", null: false
    t.integer "feed_id", null: false
    t.string "title", default: "", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["subscriber_id", "feed_id"], name: "index_subscriptions_on_subscriber_id_and_feed_id", unique: true
    t.index ["title"], name: "index_subscriptions_on_title"
  end

  create_table "users", force: :cascade do |t|
    t.string "email", null: false
    t.string "first_name", null: false
    t.string "last_name"
    t.string "password_digest", null: false
    t.string "session_token", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["email"], name: "index_users_on_email", unique: true
    t.index ["session_token"], name: "index_users_on_session_token", unique: true
  end

  add_foreign_key "social_media_markeds", "social_media_profiles"
  add_foreign_key "social_media_markeds", "users"
end
