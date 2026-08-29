/**
 * ALMS Multilingual Translation Engine (i18n)
 * Full support for English, Hindi, Marathi, Telugu
 * Persistent language storage & zero-refresh live DOM translation
 */

const ALMS_TRANSLATIONS = {
  en: {
    // Brand & Header
    "tagline": "From Surplus to Smiles.",
    "nav_home": "Home",
    "nav_roles": "Roles",
    "nav_map": "Live Support Map",
    "nav_pool": "Priority Pool",
    "nav_careme": "CareMe",
    "nav_celebrate": "Celebration",
    "nav_charity": "Charity Food",
    "nav_emergency": "Emergency Relief",
    "nav_news": "Food Matters",
    "nav_impact": "Carbon Impact",
    "nav_notifications": "Notifications",
    "nav_login": "Login / Register",
    "nav_dashboard": "Dashboard",
    "nav_logout": "Logout",

    // Roles Selection
    "role_select_title": "Join the ALMS Ecosystem",
    "role_select_sub": "Select your purpose to connect surplus food with smiles, dignity, and real-time community care.",
    "role_donator": "Donator",
    "role_donator_desc": "Share individual surplus or large commercial catering meals.",
    "role_volunteer": "Volunteer",
    "role_volunteer_desc": "Join, pick up, and deliver meals across neighborhoods.",
    "role_ngo": "NGO",
    "role_ngo_desc": "Request food, manage priority pools, and feed communities.",
    "role_charity": "Charity Food",
    "role_charity_desc": "Host mass community kitchens & temple / gurdwara langars.",
    "role_careme": "CareMeal",
    "role_careme_desc": "One-on-one direct meal request and personal donor matching.",
    "role_celebration": "Celebration",
    "role_celebration_desc": "Celebrate birthdays & milestones with shelters and orphanages.",

    // Hero Carousel
    "hero_slide1_title": "Surplus Meals, Pure Smiles",
    "hero_slide1_sub": "Bridging the gap between leftover feast food and hungry families in minutes.",
    "hero_slide2_title": "Zero Waste, Maximum Dignity",
    "hero_slide2_sub": "Empowering local volunteers and certified NGOs with real-time food rescue dispatch.",
    "hero_slide3_title": "Every Grain Has a Purpose",
    "hero_slide3_sub": "Connect directly through CareMe, Priority Pools, and Disaster Relief.",
    "hero_cta_donate": "Start Donating",
    "hero_cta_volunteer": "Become a Volunteer",
    "hero_cta_map": "View Live Support Map",

    // Priority Pool
    "pool_title": "Priority Pool",
    "pool_sub": "Real-time NGO food requests ranked dynamically by Priority Index.",
    "pool_rank": "Priority Rank",
    "pool_hunger_idx": "Hunger Index",
    "pool_distance": "Distance",
    "pool_meals_needed": "Meals Needed",
    "pool_time_left": "Time Remaining",
    "pool_veg": "Pure Veg",
    "pool_nonveg": "Non-Veg",
    "pool_contribute": "Contribute Meals",
    "pool_status_assigned": "Volunteer Assigned",
    "pool_status_completed": "Completed & Delivered",
    "pool_info_tooltip": "Priority Index = (Hunger Need % / Distance) × Time Urgency Factor",
    "pool_received_btn": "Food Received",
    "pool_rate_vol": "Rate & Review Volunteer",

    // Donator Registration & Types
    "donor_reg_title": "Donor Registration",
    "donor_reg_sub": "Choose whether you are donating as a household individual or a bulk catering establishment.",
    "donor_type_individual": "Individual Donator",
    "donor_type_individual_desc": "Leftover home food, small family gatherings, and Collab Donations.",
    "donor_type_bulk": "Bulk Donator",
    "donor_type_bulk_desc": "Mess, Restaurants, Hotels, Banquet Halls, Resorts & Caterers.",
    "donor_bulk_cat_mess": "University Mess",
    "donor_bulk_cat_hotel": "Hotel",
    "donor_bulk_cat_restaurant": "Restaurant",
    "donor_bulk_cat_wedding": "Weddings / Parties",
    "donor_bulk_cat_resort": "Resort",
    "donor_fssai": "FSSAI Certificate Upload",
    "donor_blue_tick": "Active Verified Donor Badge",

    // Collab Donation
    "collab_title": "Collab Donation",
    "collab_sub": "Combine separate dishes with nearby donors to form complete nutritious meals.",
    "collab_post_title": "Post a Collab Request",
    "collab_have_label": "What food do you have? (e.g., Chapatis, Rice)",
    "collab_seeking_label": "What are you seeking? (e.g., Dal, Sabzi, Curry)",
    "collab_prep_time": "Hours since prepared",
    "collab_qty": "Quantity (Plates/Portions)",
    "collab_nearby_title": "Compatible Matches in Your Locality",
    "collab_match_found": "Compatible Match Found!",
    "collab_btn_collab": "Collab Donate",
    "collab_btn_match": "Accept Match",

    // Bulk Donation
    "bulk_title": "Bulk Food Donation",
    "bulk_sub": "Quickly dispatch large quantity meals to verified NGOs.",
    "bulk_food_type": "Food Item Description",
    "bulk_qty_kg": "Quantity in Kilograms (KG)",
    "bulk_qty_plates": "Quantity in Number of Plates",
    "bulk_vessel_needed": "Do you need the volunteer to bring vessels/containers?",
    "bulk_vessel_litres": "Required vessel capacity in litres (L)",
    "bulk_pickup_loc": "Exact Pickup Location / Gate",
    "bulk_submit_btn": "Post Bulk Donation",

    // Volunteer Section
    "vol_reg_title": "Volunteer — Join, Help & Deliver",
    "vol_reg_sub": "Be the bridge between surplus food and someone's smile.",
    "vol_digilocker": "Verify with DigiLocker",
    "vol_govid_upload": "Government ID Proof Upload",
    "vol_welcome_verified": "Welcome to the ALMS Volunteer Community! You are an Active Verified Volunteer.",
    "vol_status_label": "Volunteer Status",
    "vol_status_avail": "Available",
    "vol_status_busy": "Busy on Task",
    "vol_status_offline": "Offline",
    "vol_assignments_title": "Active Assignments & Missions",
    "vol_special_inst": "Special Instruction: Please carry suitable food containers/vessels for this pickup.",
    "vol_mission_accept": "Accept & Help →",
    "vol_step1": "Request Received",
    "vol_step2": "Volunteer Assigned",
    "vol_step3": "Volunteer Accepts",
    "vol_step4": "Navigate to Donor",
    "vol_step5": "Food Picked Up",
    "vol_step6": "Navigate to Recipient",
    "vol_step7": "Food Delivered",
    "vol_step8": "Task Completed ✅",
    "vol_impact_title": "You've made an impact! ❤️",
    "vol_level": "Volunteer Level: Food Hero 🏆",
    "vol_meals_del": "Meals Delivered",
    "vol_people_helped": "People Helped",
    "vol_pickups": "Successful Pickups",
    "vol_waste_prev": "Food Waste Prevented",

    // CareMe
    "careme_title": "CareMe — Personal Meal Connection",
    "careme_tagline": "One meal, one person, one connection at a time.",
    "careme_role_leader": "Login as Individual Donor / Food Hero",
    "careme_role_needy": "Login as Individual Needy",
    "careme_ask_meal": "Ask for a Meal",
    "careme_meal_type": "Meal Required (Breakfast / Lunch / Dinner)",
    "careme_reason": "Reason for Meal Assistance",
    "careme_nearby_requests": "Nearby CareMe Requests",
    "careme_donor_accept_btn": "Provide Meal (Accept)",
    "careme_chat_title": "Direct Coordination & Meetup",
    "careme_chat_placeholder": "Type message to coordinate meeting point...",

    // Celebration
    "celeb_title": "Celebrate With Us",
    "celeb_quote": "“Joy shared is joy doubled. Make your special milestones memorable by sharing hearty meals.”",
    "celeb_cat_orphanage": "Orphanages",
    "celeb_cat_oldage": "Old Age Homes",
    "celeb_cat_ngo": "NGO Shelter Homes",
    "celeb_form_reason": "Occasion (Birthday, Anniversary, Achievement, etc.)",
    "celeb_form_bring": "What will you provide? (Meals, Cake, Snacks, Groceries, Gifts)",
    "celeb_form_date": "Preferred Date",
    "celeb_form_time": "Preferred Time",
    "celeb_form_guests": "Number of People Attending",
    "celeb_form_msg": "Personal Message for the Residents",
    "celeb_submit_btn": "Send Celebration Request",
    "celeb_accepted_msg": "We’re ready to celebrate with you! Your request has been accepted.",
    "celeb_reminder": "Yes, we’re waiting for you! You’re warmly welcome to celebrate with us.",

    // Charity Food
    "charity_title": "Charity Food & Community Kitchens",
    "charity_type_ind": "Individual Charity Meal Drive",
    "charity_type_temple": "Temple / Gurdwara / Religious Trust",
    "charity_form_reason": "Charity Purpose & Occasion",
    "charity_gathering": "Estimated Gathering (Headcount)",
    "charity_head_name": "Trustee / Head Name",
    "charity_submit": "Broadcast Charity Food Announcement",

    // Emergency Relief
    "emergency_title": "Emergency & Disaster Food Pool",
    "emergency_sub": "Immediate mass food and relief dispatch for floods, earthquakes, and crises.",
    "emergency_cause": "Disaster Cause & Affected Area",
    "emergency_proof": "Upload Emergency Proof / Official Photos",
    "emergency_mode_point": "1. Local Timed Collection Point",
    "emergency_mode_home": "2. Home Pickup for Bulk Relief",
    "emergency_contribute_btn": "Contribute to Emergency Pool",

    // Live Need & Support Map
    "map_title": "Live Need & Support Map",
    "map_sub": "Real-time interactive geospatial view of hunger hotspots, donors, and rescue couriers.",
    "map_legend_need": "🔴 Need Food",
    "map_legend_donor": "🟢 Donor",
    "map_legend_vol": "🔵 Volunteer",
    "map_view_full": "Open Fullscreen Map",
    "map_filter_all": "All Markers",

    // Restaurant Demand Notifications
    "restaurant_alert_title": "Restaurant Closing Reminder",
    "restaurant_alert_msg": "Your establishment is scheduled to close in 30 minutes. Please consider donating any surplus meals before closing.",
    "restaurant_demand_btn": "Send Demand Alert to Nearby Restaurants",

    // Carbon Impact
    "carbon_title": "Your Environmental Carbon Impact",
    "carbon_sub": "Estimated greenhouse gas emissions avoided through your rescued food donations.",
    "carbon_calc_msg": "Your surplus didn't become waste. It became a meal — and a better planet.",
    "carbon_co2_avoided": "kg CO₂ Avoided",
    "carbon_meals_rescued": "Meals Rescued",
    "carbon_methane": "Methane Emissions Prevented",

    // Food Matters News Corner
    "news_title": "Food Matters — Beyond the Plate",
    "news_sub": "Inspiring stories, global food security updates, and local food rescue action.",
    "news_read_more": "Read More",
    "news_latest_badge": "Latest",

    // Universal Notifications
    "notif_header": "Notifications",
    "notif_filter_all": "All",
    "notif_filter_unread": "Unread",
    "notif_filter_requests": "Requests",
    "notif_filter_donations": "Donations",
    "notif_filter_updates": "Updates",
    "notif_mark_all_read": "Mark All as Read",
    "notif_clear": "Clear All",

    // Common UI Text
    "btn_submit": "Submit",
    "btn_cancel": "Cancel",
    "btn_back": "Back",
    "btn_next": "Next",
    "btn_accept": "Accept",
    "btn_decline": "Decline",
    "btn_view_details": "View Details",
    "btn_search": "Search",
    "btn_save": "Save",
    "btn_verify_otp": "Verify OTP",
    "btn_send_otp": "Send OTP",
    "lbl_name": "Full Name",
    "lbl_phone": "Phone Number",
    "lbl_email": "Email Address",
    "lbl_location": "Location / Address",
    "lbl_pincode": "Pincode",
    "lbl_otp": "Enter 6-Digit OTP",
    "msg_loading": "Loading...",
    "msg_no_results": "No records found.",
    "msg_success": "Action completed successfully!",
    "msg_otp_sent": "Demo OTP 123456 sent to your phone.",
    "msg_otp_verified": "Phone verified successfully!",
    "footer_rights": "ALMS Humanitarian Platform. From Surplus to Smiles."
  },

  hi: {
    // Brand & Header
    "tagline": "अधिशेष भोजन से मुस्कान तक।",
    "nav_home": "होम",
    "nav_roles": "भूमिकाएं",
    "nav_map": "लाइव सहायता मानचित्र",
    "nav_pool": "प्राथमिकता पूल",
    "nav_careme": "केयर-मी",
    "nav_celebrate": "उत्सव मनाएं",
    "nav_charity": "धार्मिक एवं परोपकारी भोजन",
    "nav_emergency": "आपातकालीन राहत",
    "nav_news": "भोजन समाचार",
    "nav_impact": "कार्बन प्रभाव",
    "nav_notifications": "सूचनाएं",
    "nav_login": "लॉग इन / पंजीकरण",
    "nav_dashboard": "डैशबोर्ड",
    "nav_logout": "लॉग आउट",

    // Roles Selection
    "role_select_title": "ALMS समुदाय से जुड़ें",
    "role_select_sub": "अधिशेष भोजन को मुस्कान, गरिमा और त्वरित सामुदायिक देखभाल से जोड़ने के लिए अपनी भूमिका चुनें।",
    "role_donator": "दाता (Donator)",
    "role_donator_desc": "घर का बचा हुआ भोजन या बड़े आयोजनों का अतिरिक्त भोजन साझा करें।",
    "role_volunteer": "स्वयंसेवक (Volunteer)",
    "role_volunteer_desc": "जुड़ें, भोजन पिकअप करें और जरूरतमंदों तक पहुंचाएं।",
    "role_ngo": "एनजीओ (NGO)",
    "role_ngo_desc": "भोजन का अनुरोध करें, प्राथमिकता पूल प्रबंधित करें और समाज की सेवा करें।",
    "role_charity": "परोपकारी भोजन",
    "role_charity_desc": "सामुदायिक रसोई, मंदिर एवं गुरुद्वारा लंगर की व्यवस्था करें।",
    "role_careme": "केयरमील (CareMeal)",
    "role_careme_desc": "एक-से-एक प्रत्यक्ष भोजन अनुरोध और व्यक्तिगत दाता से मिलान।",
    "role_celebration": "उत्सव (Celebration)",
    "role_celebration_desc": "अनाथालयों और वृद्धाश्रमों के साथ जन्मदिन और विशेष दिन मनाएं।",

    // Hero Carousel
    "hero_slide1_title": "अतिरिक्त भोजन, सच्ची मुस्कान",
    "hero_slide1_sub": "बचे हुए स्वादिष्ट भोजन को कुछ ही मिनटों में भूखे परिवारों तक पहुंचाना।",
    "hero_slide2_title": "शून्य बर्बादी, पूर्ण गरिमा",
    "hero_slide2_sub": "स्थानीय स्वयंसेवकों और सत्यापित एनजीओ को त्वरित भोजन बचाव प्रणाली से सशक्त बनाना।",
    "hero_slide3_title": "हर एक दाने का एक पावन उद्देश्य",
    "hero_slide3_sub": "केयर-मी, प्राथमिकता पूल और आपदा राहत के माध्यम से सीधे जुड़ें।",
    "hero_cta_donate": "दान शुरू करें",
    "hero_cta_volunteer": "स्वयंसेवक बनें",
    "hero_cta_map": "लाइव मैप देखें",

    // Priority Pool
    "pool_title": "प्राथमिकता पूल (Priority Pool)",
    "pool_sub": "प्राथमिकता सूचकांक के अनुसार क्रमित रीयल-टाइम एनजीओ भोजन अनुरोध।",
    "pool_rank": "प्राथमिकता क्रम",
    "pool_hunger_idx": "भूख सूचकांक",
    "pool_distance": "दूरी",
    "pool_meals_needed": "आवश्यक भोजन (थाली)",
    "pool_time_left": "शेष समय",
    "pool_veg": "शुद्ध शाकाहारी",
    "pool_nonveg": "मांसाहारी",
    "pool_contribute": "भोजन योगदान करें",
    "pool_status_assigned": "स्वयंसेवक नियुक्त",
    "pool_status_completed": "सफलतापूर्वक वितरित",
    "pool_info_tooltip": "प्राथमिकता सूचकांक = (भूख आवश्यकता % / दूरी) × समय की तात्कालिकता",
    "pool_received_btn": "भोजन प्राप्त हुआ",
    "pool_rate_vol": "स्वयंसेवक की समीक्षा करें",

    // Donator Registration & Types
    "donor_reg_title": "दाता पंजीकरण",
    "donor_reg_sub": "चुनें कि आप व्यक्तिगत गृहस्थ के रूप में दान कर रहे हैं या बड़े व्यावसायिक संस्थान के रूप में।",
    "donor_type_individual": "व्यक्तिगत दाता (Individual)",
    "donor_type_individual_desc": "घर का भोजन, छोटे पारिवारिक आयोजन और सहयोगात्मक दान (Collab)।",
    "donor_type_bulk": "थोक दाता (Bulk Donator)",
    "donor_type_bulk_desc": "मेस, रेस्टोरेंट, होटल, बैंक्वेट हॉल, रिसॉर्ट और कैटरर्स।",
    "donor_bulk_cat_mess": "विश्वविद्यालय मेस",
    "donor_bulk_cat_hotel": "होटल",
    "donor_bulk_cat_restaurant": "रेस्टोरेंट",
    "donor_bulk_cat_wedding": "शादी / समारोह",
    "donor_bulk_cat_resort": "रिसॉर्ट",
    "donor_fssai": "FSSAI प्रमाण पत्र अपलोड करें",
    "donor_blue_tick": "सक्रिय सत्यापित दाता बैज",

    // Collab Donation
    "collab_title": "सहयोगात्मक दान (Collab Donation)",
    "collab_sub": "पास के दाताओं के साथ अलग-अलग व्यंजन मिलाकर संपूर्ण पौष्टिक भोजन तैयार करें।",
    "collab_post_title": "सहयोग अनुरोध पोस्ट करें",
    "collab_have_label": "आपके पास क्या भोजन उपलब्ध है? (उदा. रोटियां, चावल)",
    "collab_seeking_label": "आपको किस भोजन की आवश्यकता है? (उदा. दाल, सब्जी, कढ़ी)",
    "collab_prep_time": "भोजन बने कितने घंटे हुए हैं?",
    "collab_qty": "मात्रा (थाली / प्लेट्स)",
    "collab_nearby_title": "आपके क्षेत्र में उपयुक्त मेल",
    "collab_match_found": "अनुकूल मिलान प्राप्त हुआ!",
    "collab_btn_collab": "सहयोग दान करें",
    "collab_btn_match": "मिलान स्वीकार करें",

    // Bulk Donation
    "bulk_title": "थोक भोजन दान (Bulk Donation)",
    "bulk_sub": "सत्यापित एनजीओ को बड़ी मात्रा में भोजन शीघ्रता से भेजें।",
    "bulk_food_type": "भोजन विवरण",
    "bulk_qty_kg": "मात्रा किलोग्राम (KG) में",
    "bulk_qty_plates": "मात्रा थाली (Plates) में",
    "bulk_vessel_needed": "क्या स्वयंसेवक को बड़े बर्तन/कंटेनर लाने की आवश्यकता है?",
    "bulk_vessel_litres": "आवश्यक बर्तन क्षमता (लीटर में)",
    "bulk_pickup_loc": "पिकअप का सटीक पता व गेट",
    "bulk_submit_btn": "थोक दान पोस्ट करें",

    // Volunteer Section
    "vol_reg_title": "स्वयंसेवक — जुड़ें, मदद करें और पहुंचाएं",
    "vol_reg_sub": "अधिशेष भोजन और किसी की मुस्कान के बीच सेतु बनें।",
    "vol_digilocker": "DigiLocker से सत्यापित करें",
    "vol_govid_upload": "सरकारी पहचान पत्र अपलोड करें",
    "vol_welcome_verified": "ALMS स्वयंसेवक समुदाय में आपका स्वागत है! आप एक सक्रिय सत्यापित स्वयंसेवक हैं।",
    "vol_status_label": "स्वयंसेवक स्थिति",
    "vol_status_avail": "उपलब्ध (Available)",
    "vol_status_busy": "कार्य में व्यस्त",
    "vol_status_offline": "ऑफलाइन",
    "vol_assignments_title": "सक्रिय कार्य एवं मिशन",
    "vol_special_inst": "विशेष निर्देश: कृपया इस पिकअप के लिए उपयुक्त भोजन के बर्तन साथ लाएं।",
    "vol_mission_accept": "स्वीकार करें और मदद करें →",
    "vol_step1": "अनुरोध प्राप्त हुआ",
    "vol_step2": "स्वयंसेवक नियुक्त",
    "vol_step3": "स्वयंसेवक ने स्वीकार किया",
    "vol_step4": "दाता की ओर प्रस्थान",
    "vol_step5": "भोजन पिकअप किया गया",
    "vol_step6": "प्राप्तकर्ता की ओर प्रस्थान",
    "vol_step7": "भोजन सफलतापूर्वक वितरित",
    "vol_step8": "कार्य पूर्ण ✅",
    "vol_impact_title": "आपने एक सुंदर बदलाव किया है! ❤️",
    "vol_level": "स्वयंसेवक स्तर: फूड हीरो 🏆",
    "vol_meals_del": "वितरित भोजन थालियां",
    "vol_people_helped": "लाभान्वित व्यक्ति",
    "vol_pickups": "सफल पिकअप",
    "vol_waste_prev": "भोजन बर्बादी से बचाया",

    // CareMe
    "careme_title": "केयर-मी — व्यक्तिगत भोजन संपर्क",
    "careme_tagline": "एक भोजन, एक व्यक्ति, एक समय में एक आत्मीय संबंध।",
    "careme_role_leader": "व्यक्तिगत दाता के रूप में लॉगिन करें",
    "careme_role_needy": "भोजन की आवश्यकता वाले व्यक्ति के रूप में लॉगिन करें",
    "careme_ask_meal": "भोजन के लिए अनुरोध करें",
    "careme_meal_type": "आवश्यक भोजन (नाश्ता / दोपहर का भोजन / रात का भोजन)",
    "careme_reason": "भोजन सहायता का कारण",
    "careme_nearby_requests": "आसपास के केयर-मी अनुरोध",
    "careme_donor_accept_btn": "भोजन प्रदान करें (स्वीकार करें)",
    "careme_chat_title": "प्रत्यक्ष बातचीत और मिलने का स्थान",
    "careme_chat_placeholder": "मिलने के स्थान के लिए संदेश लिखें...",

    // Celebration
    "celeb_title": "हमारे साथ जश्न मनाएँ",
    "celeb_quote": "“बांटी गई खुशी दोगुनी हो जाती है। अपने विशेष पलों को जरूरतमंदों के साथ भोजन साझा करके यादगार बनाएं।”",
    "celeb_cat_orphanage": "अनाथालय",
    "celeb_cat_oldage": "वृद्धाश्रम",
    "celeb_cat_ngo": "एनजीओ आश्रय गृह",
    "celeb_form_reason": "उत्सव का अवसर (जन्मदिन, सालगिरह, विशेष उपलब्धि)",
    "celeb_form_bring": "आप क्या लाना चाहेंगे? (भोजन, केक, फल, राशन, उपहार)",
    "celeb_form_date": "पसंदीदा तिथि",
    "celeb_form_time": "पसंदीदा समय",
    "celeb_form_guests": "शामिल होने वाले लोगों की संख्या",
    "celeb_form_msg": "संस्थान के लिए आपका व्यक्तिगत संदेश",
    "celeb_submit_btn": "उत्सव के लिए अनुरोध करें",
    "celeb_accepted_msg": "हम आपके साथ जश्न मनाने के लिए तैयार हैं! आपका अनुरोध स्वीकार कर लिया गया है।",
    "celeb_reminder": "हाँ, हम आपका इंतज़ार कर रहे हैं! आपका हमारे साथ उत्सव मनाने के लिए हार्दिक स्वागत है।",

    // Charity Food
    "charity_title": "धार्मिक एवं परोपकारी भोजन",
    "charity_type_ind": "व्यक्तिगत परोपकार भोजन",
    "charity_type_temple": "मंदिर / गुरुद्वारा / धार्मिक ट्रस्ट",
    "charity_form_reason": "दान का उद्देश्य व अवसर",
    "charity_gathering": "अनुमानित संख्या",
    "charity_head_name": "ट्रस्टी / प्रमुख का नाम",
    "charity_submit": "परोपकारी भोजन की घोषणा करें",

    // Emergency Relief
    "emergency_title": "आपातकालीन एवं आपदा भोजन पूल",
    "emergency_sub": "बाढ़, भूकंप और संकट के समय त्वरित सामूहिक भोजन एवं राहत सामग्री वितरण।",
    "emergency_cause": "आपदा का कारण एवं प्रभावित क्षेत्र",
    "emergency_proof": "आपातकालीन प्रमाण / तस्वीरें अपलोड करें",
    "emergency_mode_point": "1. स्थानीय समयबद्ध संग्रह केंद्र",
    "emergency_mode_home": "2. बड़े राहत पैकेज हेतु घर से पिकअप",
    "emergency_contribute_btn": "आपातकालीन पूल में योगदान करें",

    // Live Need & Support Map
    "map_title": "लाइव सहायता मानचित्र (Live Map)",
    "map_sub": "भूख प्रभावित क्षेत्रों, दाताओं और स्वयंसेवकों का रीयल-टाइम मानचित्र।",
    "map_legend_need": "🔴 भोजन की आवश्यकता",
    "map_legend_donor": "🟢 दाता",
    "map_legend_vol": "🔵 स्वयंसेवक",
    "map_view_full": "पूर्ण स्क्रीन मानचित्र खोलें",
    "map_filter_all": "सभी स्थान",

    // Restaurant Demand Notifications
    "restaurant_alert_title": "रेस्टोरेंट समापन स्मरण",
    "restaurant_alert_msg": "आपका रेस्टोरेंट 30 मिनट में बंद होने वाला है। कृपया बचा हुआ भोजन दान करने पर विचार करें।",
    "restaurant_demand_btn": "पास के रेस्टोरेंट्स को मांग सूचना भेजें",

    // Carbon Impact
    "carbon_title": "आपका पर्यावरणीय कार्बन प्रभाव",
    "carbon_sub": "बचाए गए भोजन के माध्यम से रोके गए ग्रीनहाउस गैस उत्सर्जन का सटीक अनुमान।",
    "carbon_calc_msg": "आपका अतिरिक्त भोजन कचरा नहीं बना। यह एक तृप्त भोजन और एक बेहतर पृथ्वी बना।",
    "carbon_co2_avoided": "किग्रा CO₂ बचाया गया",
    "carbon_meals_rescued": "बचाई गई थालियां",
    "carbon_methane": "रोका गया मीथेन उत्सर्जन",

    // Food Matters News Corner
    "news_title": "भोजन समाचार — थाली से परे",
    "news_sub": "प्रेरणादायक कहानियां, वैश्विक खाद्य सुरक्षा और स्थानीय भोजन बचाव के प्रयास।",
    "news_read_more": "और पढ़ें",
    "news_latest_badge": "ताज़ा खबर",

    // Universal Notifications
    "notif_header": "सूचनाएं",
    "notif_filter_all": "सभी",
    "notif_filter_unread": "अपठित",
    "notif_filter_requests": "अनुरोध",
    "notif_filter_donations": "दान",
    "notif_filter_updates": "अपडेट",
    "notif_mark_all_read": "सभी को पढ़ा हुआ चिह्नित करें",
    "notif_clear": "सभी हटाएं",

    // Common UI Text
    "btn_submit": "जमा करें",
    "btn_cancel": "रद्द करें",
    "btn_back": "पीछे जाएं",
    "btn_next": "आगे बढ़ें",
    "btn_accept": "स्वीकार करें",
    "btn_decline": "अस्वीकार करें",
    "btn_view_details": "विवरण देखें",
    "btn_search": "खोजें",
    "btn_save": "सुरक्षित करें",
    "btn_verify_otp": "ओटीपी सत्यापित करें",
    "btn_send_otp": "ओटीपी भेजें",
    "lbl_name": "पूरा नाम",
    "lbl_phone": "फ़ोन नंबर",
    "lbl_email": "ईमेल पता",
    "lbl_location": "स्थान / पता",
    "lbl_pincode": "पिनकोड",
    "lbl_otp": "6 अंकों का ओटीपी दर्ज करें",
    "msg_loading": "लोड हो रहा है...",
    "msg_no_results": "कोई परिणाम नहीं मिला।",
    "msg_success": "कार्य सफलतापूर्वक संपन्न हुआ!",
    "msg_otp_sent": "डेमो ओटीपी 123456 भेजा गया।",
    "msg_otp_verified": "फ़ोन सफलतापूर्वक सत्यापित हुआ!",
    "footer_rights": "ALMS परोपकारी मंच। अधिशेष भोजन से मुस्कान तक।"
  },

  mr: {
    // Brand & Header
    "tagline": "अन्नदानातून चेहऱ्यावर हास्य.",
    "nav_home": "मुख्यपृष्ठ",
    "nav_roles": "भूमिका",
    "nav_map": "थेट मदत नकाशा",
    "nav_pool": "प्राधान्य पूल",
    "nav_careme": "केअर-मी",
    "nav_celebrate": "आनंदोत्सव",
    "nav_charity": "धार्मिक व सेवा अन्न",
    "nav_emergency": "आपत्कालीन मदत",
    "nav_news": "अन्न वार्ता",
    "nav_impact": "कार्बन प्रभाव",
    "nav_notifications": "सूचना",
    "nav_login": "लॉग इन / नोंदणी",
    "nav_dashboard": "डॅशबोर्ड",
    "nav_logout": "लॉग आउट",

    // Roles Selection
    "role_select_title": "ALMS परिवारात सहभागी व्हा",
    "role_select_sub": "अतिरिक्त अन्न गरजूंपर्यंत पोहोचवून समाधान व आदर निर्माण करण्यासाठी योग्य पर्याय निवडा.",
    "role_donator": "अन्नदाता (Donator)",
    "role_donator_desc": "घरगुती उरलेले अन्न किंवा मोठ्या समारंभातील अतिरिक्त अन्न दान करा.",
    "role_volunteer": "स्वयंसेवक (Volunteer)",
    "role_volunteer_desc": "सहभागी व्हा, अन्न गोळा करा आणि गरजूंपर्यंत पोहोचवा.",
    "role_ngo": "एनजीओ (NGO)",
    "role_ngo_desc": "अन्नाची मागणी नोंदवा, प्राधान्य पूल व्यवस्थापित करा आणि सेवा करा.",
    "role_charity": "धार्मिक अन्नछत्र",
    "role_charity_desc": "मंदिर, गुरुद्वारा आणि सामाजिक महाप्रसादाची घोषणा करा.",
    "role_careme": "केअरमील (CareMeal)",
    "role_careme_desc": "एका व्यक्तीची जेवणाची थेट मागणी आणि वैयक्तिक दात्याशी जोडणी.",
    "role_celebration": "आनंदोत्सव (Celebration)",
    "role_celebration_desc": "अनाथालये व वृद्धाश्रमांसोबत वाढदिवस व सुखद प्रसंग साजरे करा.",

    // Hero Carousel
    "hero_slide1_title": "अतिरिक्त अन्न, तृप्त हास्य",
    "hero_slide1_sub": "उरलेले सकस अन्न काही मिनिटांत भुकेल्या लोकांपर्यंत पोहोचवणे.",
    "hero_slide2_title": "शून्य नासाडी, पूर्ण सन्मान",
    "hero_slide2_sub": "स्थानिक स्वयंसेवक आणि एनजीओंना आधुनिक अन्न बचाव प्रणालीने सक्षम करणे.",
    "hero_slide3_title": "प्रत्येक अन्नाच्या कणाला एक आधार",
    "hero_slide3_sub": "केअर-मी, प्राधान्य पूल आणि आपत्कालीन सेवेद्वारे थेट सहकार्य.",
    "hero_cta_donate": "दान सुरू करा",
    "hero_cta_volunteer": "स्वयंसेवक व्हा",
    "hero_cta_map": "थेट नकाशा पहा",

    // Priority Pool
    "pool_title": "प्राधान्य पूल (Priority Pool)",
    "pool_sub": "प्राधान्य निर्देशांकावर आधारित एनजीओंची थेट अन्न मागणी.",
    "pool_rank": "प्राधान्य क्रमांक",
    "pool_hunger_idx": "भूक निर्देशांक",
    "pool_distance": "अंतर",
    "pool_meals_needed": "आवश्यक ताटे (Meals)",
    "pool_time_left": "उरलेला वेळ",
    "pool_veg": "शाकाहारी",
    "pool_nonveg": "मांसाहारी",
    "pool_contribute": "अन्न योगदान द्या",
    "pool_status_assigned": "स्वयंसेवक नियुक्त",
    "pool_status_completed": "यशस्वीरित्या वितरित",
    "pool_info_tooltip": "प्राधान्य निर्देशांक = (भूक गरज % / अंतर) × तातडीचे प्रमाण",
    "pool_received_btn": "अन्न मिळाले",
    "pool_rate_vol": "स्वयंसेवकाचे मूल्यमापन करा",

    // Donator Registration & Types
    "donor_reg_title": "अन्नदाता नोंदणी",
    "donor_reg_sub": "तुम्ही वैयक्तिक गृहस्थ आहात की मोठा व्यावसायिक आस्थापना हे निवडा.",
    "donor_type_individual": "वैयक्तिक दाता",
    "donor_type_individual_desc": "घरातील उरलेले अन्न आणि एकत्रित दान (Collab).",
    "donor_type_bulk": "मोठा दाता (Bulk)",
    "donor_type_bulk_desc": "मेस, हॉटेल्स, रेस्टॉरंट्स, मंगल कार्यालये व केटरर्स.",
    "donor_bulk_cat_mess": "विद्यापीठ मेस",
    "donor_bulk_cat_hotel": "हॉटेल",
    "donor_bulk_cat_restaurant": "रेस्टॉरंट",
    "donor_bulk_cat_wedding": "विवाह / समारंभ",
    "donor_bulk_cat_resort": "रिसॉर्ट",
    "donor_fssai": "FSSAI प्रमाणपत्र अपलोड करा",
    "donor_blue_tick": "सक्रिय पडताळणीकृत दाता बिल्ला",

    // Collab Donation
    "collab_title": "एकत्रित दान (Collab Donation)",
    "collab_sub": "जवळपासच्या दात्यांशी समन्वय साधून परिपूर्ण थाळी तयार करा.",
    "collab_post_title": "सहयोग विनंती पोस्ट करा",
    "collab_have_label": "तुमच्याकडे कोणते अन्न उपलब्ध आहे? (उदा. पोळ्या, भात)",
    "collab_seeking_label": "तुम्हाला कशाची गरज आहे? (उदा. डाळ, भाजी, आमटी)",
    "collab_prep_time": "अन्न तयार होऊन किती तास झाले?",
    "collab_qty": "प्रमाण (ताटे / व्यक्ती)",
    "collab_nearby_title": "परिसरातील योग्य जुळण्या",
    "collab_match_found": "सुसंगत जुळणी सापडली!",
    "collab_btn_collab": "सहयोग दान करा",
    "collab_btn_match": "जुळणी स्वीकारा",

    // Bulk Donation
    "bulk_title": "मोठ्या प्रमाणातील अन्नदान (Bulk Donation)",
    "bulk_sub": "सत्यापित एनजीओंना मोठ्या प्रमाणावर अन्न त्वरित पाठवा.",
    "bulk_food_type": "अन्नाचा प्रकार व तपशील",
    "bulk_qty_kg": "प्रमाण किलोमध्ये (KG)",
    "bulk_qty_plates": "प्रमाण ताटांमध्ये (Plates)",
    "bulk_vessel_needed": "स्वयंसेवकाने स्वतःची भांडी आणणे आवश्यक आहे का?",
    "bulk_vessel_litres": "आवश्यक भांड्यांची क्षमता (लिटरमध्ये)",
    "bulk_pickup_loc": "पिकअप पत्ता व गेट",
    "bulk_submit_btn": "मोठे दान पोस्ट करा",

    // Volunteer Section
    "vol_reg_title": "स्वयंसेवक — सामील व्हा, मदत करा व पोहोचवा",
    "vol_reg_sub": "अतिरिक्त अन्न आणि भुकेल्यांच्या समाधानामधील विश्वासाचा पूल व्हा.",
    "vol_digilocker": "DigiLocker द्वारे पडताळणी करा",
    "vol_govid_upload": "शासकीय ओळखपत्र अपलोड करा",
    "vol_welcome_verified": "ALMS स्वयंसेवक परिवारात आपले स्वागत आहे! आपण प्रमाणित स्वयंसेवक आहात.",
    "vol_status_label": "स्वयंसेवक स्थिती",
    "vol_status_avail": "उपलब्ध (Available)",
    "vol_status_busy": "कामात व्यस्त",
    "vol_status_offline": "ऑफलाइन",
    "vol_assignments_title": "सक्रिय कार्ये व मोहिमा",
    "vol_special_inst": "विशेष सूचना: कृपया या पिकअपसाठी योग्य आकाराची भांडी सोबत आणा.",
    "vol_mission_accept": "स्वीकारा आणि मदत करा →",
    "vol_step1": "विनंती प्राप्त झाली",
    "vol_step2": "स्वयंसेवक नियुक्त",
    "vol_step3": "स्वयंसेवकाने स्वीकारले",
    "vol_step4": "दात्याकडे मार्गक्रमण",
    "vol_step5": "अन्न गोळा केले",
    "vol_step6": "गरजूंकडे मार्गक्रमण",
    "vol_step7": "अन्न सुपूर्द केले",
    "vol_step8": "कार्य यशस्वी ✅",
    "vol_impact_title": "तुमच्यामुळे मोलाचा बदल घडला! ❤️",
    "vol_level": "स्वयंसेवक स्तर: फूड हिरो 🏆",
    "vol_meals_del": "वितरित जेवणाची ताटे",
    "vol_people_helped": "मदत मिळालेल्या व्यक्ती",
    "vol_pickups": "यशस्वी पिकअप्स",
    "vol_waste_prev": "अन्नाची नासाडी रोखली",

    // CareMe
    "careme_title": "केयर-मी — थेट वैयक्तिक अन्न सेवा",
    "careme_tagline": "एक वेळचे जेवण, एक व्यक्ती, एक आपुलकीचे नाते.",
    "careme_role_leader": "वैयक्तिक दाता म्हणून लॉगिन करा",
    "careme_role_needy": "अन्नाची गरज असलेली व्यक्ती म्हणून लॉगिन करा",
    "careme_ask_meal": "जेवणासाठी विनंती करा",
    "careme_meal_type": "आवश्यक जेवण (नाश्ता / दुपारचे जेवण / रात्रीचे जेवण)",
    "careme_reason": "अन्न मदतीचे कारण",
    "careme_nearby_requests": "परिसरातील केअर-मी विनंत्या",
    "careme_donor_accept_btn": "जेवण द्या (स्वीकारा)",
    "careme_chat_title": "थेट संपर्क व भेटण्याची जागा",
    "careme_chat_placeholder": "भेटण्याच्या ठिकाणासाठी संदेश लिहा...",

    // Celebration
    "celeb_title": "आमच्यासोबत आनंद साजरा करा",
    "celeb_quote": "“आनंद वाटल्याने द्विगुणित होतो. आपले वाढदिवस आणि विशेष प्रसंग गरजवंतांसोबत जेवण वाटून अविस्मरणीय करा.”",
    "celeb_cat_orphanage": "अनाथालये",
    "celeb_cat_oldage": "वृद्धाश्रम",
    "celeb_cat_ngo": "एनजीओ निवारा गृह",
    "celeb_form_reason": "समारंभाचे कारण (वाढदिवस, लग्नाचा वाढदिवस, विशेष यश)",
    "celeb_form_bring": "तुम्ही काय देणार आहात? (जेवण, केक, नाश्ता, धान्य, भेटवस्तू)",
    "celeb_form_date": "इच्छित तारीख",
    "celeb_form_time": "इच्छित वेळ",
    "celeb_form_guests": "उपस्थित राहणाऱ्या लोकांची संख्या",
    "celeb_form_msg": "संस्थेसाठी आपला वैयक्तिक संदेश",
    "celeb_submit_btn": "उत्सवासाठी विनंती करा",
    "celeb_accepted_msg": "आम्ही आपल्यासोबत आनंद साजरा करण्यास तयार आहोत! आपली विनंती स्वीकारली गेली आहे.",
    "celeb_reminder": "होय, आम्ही आपली वाट पाहत आहोत! आमच्यासोबत उत्सव साजरा करण्यासाठी आपले मनापासून स्वागत आहे.",

    // Charity Food
    "charity_title": "धार्मिक व सेवा अन्नछत्र",
    "charity_type_ind": "वैयक्तिक सेवा अन्नदान",
    "charity_type_temple": "मंदिर / गुरुद्वारा / धार्मिक संस्था",
    "charity_form_reason": "अन्नदानाचे कारण व प्रसंग",
    "charity_gathering": "अंदाजे उपस्थिती",
    "charity_head_name": "विश्वस्त / प्रमुखांचे नाव",
    "charity_submit": "अन्नछत्राची घोषणा प्रसिद्ध करा",

    // Emergency Relief
    "emergency_title": "आपत्कालीन व संकट निवारण अन्न पूल",
    "emergency_sub": "पूर, भूकंप व संकटाच्या वेळी त्वरित मोठ्या प्रमाणावर अन्न व मदत वाटप.",
    "emergency_cause": "आपत्तीचे स्वरूप व बाधित परिसर",
    "emergency_proof": "आपत्तीचे पुरावे व छायाचित्रे जोडा",
    "emergency_mode_point": "1. स्थानिक मर्यादित वेळेचे संकलन केंद्र",
    "emergency_mode_home": "2. मोठ्या मदतीसाठी घरून पिकअप",
    "emergency_contribute_btn": "आपत्कालीन पूलमधे योगदान द्या",

    // Live Need & Support Map
    "map_title": "थेट मदत नकाशा (Live Map)",
    "map_sub": "गरजू ठिकाणे, अन्नदाते आणि स्वयंसेवकांचे थेट भौगोलिक दर्शन.",
    "map_legend_need": "🔴 अन्नाची गरज",
    "map_legend_donor": "🟢 अन्नदाता",
    "map_legend_vol": "🔵 स्वयंसेवक",
    "map_view_full": "पूर्ण नकाशा उघडा",
    "map_filter_all": "सर्व ठिकाणे",

    // Restaurant Demand Notifications
    "restaurant_alert_title": "रेस्टॉरंट बंद होण्याची आठवण",
    "restaurant_alert_msg": "आपले रेस्टॉरंट पुढील ३० मिनिटांत बंद होत आहे. कृपया उरलेले अन्न दान करण्याचा विचार करा.",
    "restaurant_demand_btn": "परिसरातील रेस्टॉरंट्सना मागणी सूचना पाठवा",

    // Carbon Impact
    "carbon_title": "पर्यावरणीय कार्बन प्रभाव",
    "carbon_sub": "अन्न वाचवल्यामुळे रोखले गेलेले घातक हरितगृह वायूंचे अचूक प्रमाण.",
    "carbon_calc_msg": "तुमचे अतिरिक्त अन्न कचरा झाले नाही. ते कोणाचे तरी जेवण आणि पृथ्वीचे रक्षण बनले.",
    "carbon_co2_avoided": "किलो CO₂ रोखला",
    "carbon_meals_rescued": "वाचवलेली जेवणाची ताटे",
    "carbon_methane": "रोखलेला मिथेन वायू",

    // Food Matters News Corner
    "news_title": "अन्न वार्ता — ताटापलीकडील जग",
    "news_sub": "प्रेरणादायी कथा, जागतिक अन्न सुरक्षा आणि स्थानिक अन्न बचावाचे प्रयत्न.",
    "news_read_more": "सविस्तर वाचा",
    "news_latest_badge": "नवीन बातमी",

    // Universal Notifications
    "notif_header": "सूचना व संदेश",
    "notif_filter_all": "सर्व",
    "notif_filter_unread": "न वाचलेले",
    "notif_filter_requests": "मागण्या",
    "notif_filter_donations": "दाने",
    "notif_filter_updates": "अपडेट्स",
    "notif_mark_all_read": "सर्व वाचलेले करा",
    "notif_clear": "सर्व काढा",

    // Common UI Text
    "btn_submit": "जतन करा",
    "btn_cancel": "रद्द करा",
    "btn_back": "मागे जा",
    "btn_next": "पुढे जा",
    "btn_accept": "स्वीकारा",
    "btn_decline": "नाकारा",
    "btn_view_details": "तपशील पहा",
    "btn_search": "शोधा",
    "btn_save": "सुरक्षित करा",
    "btn_verify_otp": "ओटीपी पडताळा",
    "btn_send_otp": "ओटीपी पाठवा",
    "lbl_name": "पूर्ण नाव",
    "lbl_phone": "फोन नंबर",
    "lbl_email": "ईमेल पत्ता",
    "lbl_location": "पत्ता / ठिकाण",
    "lbl_pincode": "पिनकोड",
    "lbl_otp": "६ अंकी ओटीपी टाका",
    "msg_loading": "लोड होत आहे...",
    "msg_no_results": "कोणतेही परिणाम आढळले नाहीत.",
    "msg_success": "कृती यशस्वी झाली!",
    "msg_otp_sent": "डेमो ओटीपी 123456 पाठवला आहे.",
    "msg_otp_verified": "फोन यशस्वीरित्या पडताळला गेला!",
    "footer_rights": "ALMS मानवतावादी मंच. अन्नदानातून चेहऱ्यावर हास्य."
  },

  te: {
    // Brand & Header
    "tagline": "మిగులు ఆహారం నుండి చిరునవ్వుల దాకా.",
    "nav_home": "హోమ్",
    "nav_roles": "పాత్రలు",
    "nav_map": "లైవ్ మద్దతు మ్యాప్",
    "nav_pool": "ప్రాధాన్యత పూల్",
    "nav_careme": "కేర్-మీ",
    "nav_celebrate": "వేడుక",
    "nav_charity": "ధార్మిక ఆహారం",
    "nav_emergency": "అత్యవసర సహాయం",
    "nav_news": "ఆహార విశేషాలు",
    "nav_impact": "కార్బన్ ప్రభావం",
    "nav_notifications": "నోటిఫికేషన్లు",
    "nav_login": "లాగిన్ / రిజిస్ట్రేషన్",
    "nav_dashboard": "డ్యాష్‌బోర్డ్",
    "nav_logout": "లాగ్ అవుట్",

    // Roles Selection
    "role_select_title": "ALMS వ్యవస్థలో భాగస్వామ్యం అవ్వండి",
    "role_select_sub": "మిగులు ఆహారాన్ని చిరునవ్వులు, గౌరవం మరియు సత్వర సహాయంతో అనుసంధానించడానికి మీ పాత్రను ఎంచుకోండి.",
    "role_donator": "దాత (Donator)",
    "role_donator_desc": "ఇంట్లోని మిగులు లేదా పెద్ద వేడుకల భోజనాన్ని దానం చేయండి.",
    "role_volunteer": "వాలంటీర్ (Volunteer)",
    "role_volunteer_desc": "చేరండి, ఆహారాన్ని సేకరించండి మరియు అవసరమైన వారికి అందించండి.",
    "role_ngo": "ఎన్జీవో (NGO)",
    "role_ngo_desc": "ఆహార అభ్యర్థనలు చేయండి, ప్రాధాన్యత పూల్ నిర్వహించండి మరియు ఆకలి తీర్చండి.",
    "role_charity": "ధార్మిక ఆహారం",
    "role_charity_desc": "సామూహిక అన్నదానాలు, దేవాలయ మరియు గురుద్వారా లంగర్లు నిర్వహించండి.",
    "role_careme": "కేర్‌మీల్ (CareMeal)",
    "role_careme_desc": "వ్యక్తిగత ఆహార అభ్యర్థన మరియు ప్రత్యక్ష దాత కలయిక.",
    "role_celebration": "వేడుక (Celebration)",
    "role_celebration_desc": "అనాథాశ్రమాలు, వృద్ధాశ్రమాలలో పుట్టినరోజులు మరియు ప్రత్యేక దినాలు జరుపుకోండి.",

    // Hero Carousel
    "hero_slide1_title": "మిగులు భోజనం, స్వచ్ఛమైన చిరునవ్వు",
    "hero_slide1_sub": "మిగిలిన రుచికరమైన ఆహారాన్ని నిమిషాల్లో ఆకలితో ఉన్న కుటుంబాలకు అందించడం.",
    "hero_slide2_title": "జీరో వేస్ట్, సంపూర్ణ గౌరవం",
    "hero_slide2_sub": "స్థానిక వాలంటీర్లు మరియు ధృవీకరించబడిన NGOలను లైవ్ ఆహార సహాయ వ్యవస్థతో బలోపేతం చేయడం.",
    "hero_slide3_title": "ప్రతి మెతుకుకు ఒక ఆశయం",
    "hero_slide3_sub": "కేర్-మీ, ప్రయారిటీ పూల్ మరియు అత్యవసర సహాయం ద్వారా నేరుగా కనెక్ట్ అవ్వండి.",
    "hero_cta_donate": "దానం ప్రారంభించండి",
    "hero_cta_volunteer": "వాలంటీర్ అవ్వండి",
    "hero_cta_map": "లైవ్ మ్యాప్ చూడండి",

    // Priority Pool
    "pool_title": "ప్రాధాన్యత పూల్ (Priority Pool)",
    "pool_sub": "ప్రాధాన్యత సూచిక ఆధారంగా నిజ సమయ NGO ఆహార డిమాండ్లు.",
    "pool_rank": "ప్రాధాన్యత ర్యాంక్",
    "pool_hunger_idx": "ఆకలి సూచిక",
    "pool_distance": "దూరం",
    "pool_meals_needed": "అవసరమైన భోజనాలు",
    "pool_time_left": "మిగిలిన సమయం",
    "pool_veg": "శాకాహారం",
    "pool_nonveg": "మాంసాహారం",
    "pool_contribute": "భోజనం అందించండి",
    "pool_status_assigned": "వాలంటీర్ కేటాయించబడ్డారు",
    "pool_status_completed": "విజయవంతంగా అందించబడింది",
    "pool_info_tooltip": "ప్రాధాన్యత సూచిక = (ఆకలి తీవ్రత % / దూరం) × సమయ ఆవశ్యకత",
    "pool_received_btn": "ఆహారం అందింది",
    "pool_rate_vol": "వాలంటీర్‌ను సమీక్షించండి",

    // Donator Registration & Types
    "donor_reg_title": "దాత నమోదు",
    "donor_reg_sub": "మీరు వ్యక్తిగతంగానా లేదా పెద్ద వ్యాపార సంస్థగా దానం చేస్తున్నారా ఎంచుకోండి.",
    "donor_type_individual": "వ్యక్తిగత దాత (Individual)",
    "donor_type_individual_desc": "ఇంటి భోజనం, చిన్న కుటుంబ వేడుకలు మరియు కోలాబ్ డొనేషన్.",
    "donor_type_bulk": "బల్క్ దాత (Bulk Donator)",
    "donor_type_bulk_desc": "మెస్, రెస్టారెంట్లు, హోటళ్ళు, ఫంక్షన్ హాళ్ళు, రిసార్టులు మరియు కేటరర్లు.",
    "donor_bulk_cat_mess": "యూనివర్సిటీ మెస్",
    "donor_bulk_cat_hotel": "హోటల్",
    "donor_bulk_cat_restaurant": "రెస్టారెంట్",
    "donor_bulk_cat_wedding": "వివాహాలు / వేడుకలు",
    "donor_bulk_cat_resort": "రిసార్ట్",
    "donor_fssai": "FSSAI సర్టిఫికెట్ అప్‌లోడ్",
    "donor_blue_tick": "యాక్టివ్ వెరిఫైడ్ దాత బ్యాడ్జ్",

    // Collab Donation
    "collab_title": "సహకార దానం (Collab Donation)",
    "collab_sub": "పరిసర ప్రాంత దాతలతో కలిసి పూర్తి పౌష్టికాహార భోజనాన్ని అందించండి.",
    "collab_post_title": "కొల్లాబ్ అభ్యర్థనను పోస్ట్ చేయండి",
    "collab_have_label": "మీ వద్ద ఉన్న ఆహారం ఏమిటి? (ఉదా. చపాతీలు, అన్నం)",
    "collab_seeking_label": "మీకు కావాల్సిన పదార్థం ఏమిటి? (ఉదా. పప్పు, కూర, సాంబారు)",
    "collab_prep_time": "ఆహారం వండి ఎన్ని గంటలైంది?",
    "collab_qty": "పరిమాణం (ప్లేట్లు)",
    "collab_nearby_title": "మీ ప్రాంతంలో సరిపోలే అభ్యర్థనలు",
    "collab_match_found": "అనువైన జత దొరికింది!",
    "collab_btn_collab": "కొల్లాబ్ దానం",
    "collab_btn_match": "మ్యాచ్ స్వీకరించండి",

    // Bulk Donation
    "bulk_title": "భారీ ఆహార దానం (Bulk Donation)",
    "bulk_sub": "ధృవీకరించబడిన ఎన్జీవోలకు పెద్ద మొత్తంలో ఆహారాన్ని వెంటనే పంపండి.",
    "bulk_food_type": "ఆహార వివరాలు",
    "bulk_qty_kg": "పరిమాణం కిలోలలో (KG)",
    "bulk_qty_plates": "పరిమాణం ప్లేట్లలో (Plates)",
    "bulk_vessel_needed": "వాలంటీర్ పెద్ద పాత్రలు తీసుకురావాలా?",
    "bulk_vessel_litres": "అవసరమైన పాత్రల సామర్థ్యం (లీటర్లలో)",
    "bulk_pickup_loc": "పికప్ ప్రదేశం మరియు గేట్ వివరాలు",
    "bulk_submit_btn": "బల్క్ డొనేషన్ పోస్ట్ చేయండి",

    // Volunteer Section
    "vol_reg_title": "వాలంటీర్ — చేరండి, సహాయపడండి మరియు అందించండి",
    "vol_reg_sub": "మిగులు ఆహారానికి మరియు ఆకలితో ఉన్న వారి చిరునవ్వుకు వారధిగా ఉండండి.",
    "vol_digilocker": "DigiLocker ద్వారా ధృవీకరించండి",
    "vol_govid_upload": "ప్రభుత్వ గుర్తింపు కార్డు అప్‌లోడ్ చేయండి",
    "vol_welcome_verified": "ALMS వాలంటీర్ కమ్యూనిటీకి స్వాగతం! మీరు ధృవీకరించబడిన వాలంటీర్.",
    "vol_status_label": "వాలంటీర్ స్థితి",
    "vol_status_avail": "అందుబాటులో ఉన్నారు (Available)",
    "vol_status_busy": "పనిలో ఉన్నారు",
    "vol_status_offline": "ఆఫ్‌లైన్",
    "vol_assignments_title": "ప్రస్తుత మిషన్లు & అసైన్‌మెంట్లు",
    "vol_special_inst": "ప్రత్యేక సూచన: దయచేసి ఈ పికప్ కోసం తగిన ఆహార పాత్రలను వెంట తీసుకురండి.",
    "vol_mission_accept": "స్వీకరించి సహాయపడండి →",
    "vol_step1": "అభ్యర్థన అందింది",
    "vol_step2": "వాలంటీర్ కేటాయింపు",
    "vol_step3": "వాలంటీర్ అంగీకారం",
    "vol_step4": "దాత వద్దకు ప్రయాణం",
    "vol_step5": "ఆహారం సేకరించబడింది",
    "vol_step6": "గ్రహీత వద్దకు ప్రయాణం",
    "vol_step7": "ఆహారం అందించబడింది",
    "vol_step8": "మిషన్ విజయవంతం ✅",
    "vol_impact_title": "మీరు గొప్ప మార్పును తెచ్చారు! ❤️",
    "vol_level": "వాలంటీర్ స్థాయి: ఫుడ్ హీరో 🏆",
    "vol_meals_del": "అందించిన భోజనాలు",
    "vol_people_helped": "సహాయం పొందిన వ్యక్తులు",
    "vol_pickups": "విజయవంతమైన పికప్‌లు",
    "vol_waste_prev": "ఆహార వృథా నివారణ",

    // CareMe
    "careme_title": "కేర్-మీ — ప్రత్యక్ష వ్యక్తిగత భోజన సహాయం",
    "careme_tagline": "ఒక భోజనం, ఒక వ్యక్తి, ఒకే సమయంలో ఒక ఆత్మీయ అనుబంధం.",
    "careme_role_leader": "వ్యక్తిగత దాతగా లాగిన్ అవ్వండి",
    "careme_role_needy": "భోజన అవసరమున్న వ్యక్తిగా లాగిన్ అవ్వండి",
    "careme_ask_meal": "భోజనం కోసం అభ్యర్థించండి",
    "careme_meal_type": "అవసరమైన భోజనం (అల్పాహారం / మధ్యాహ్నం / రాత్రి భోజనం)",
    "careme_reason": "భోజన సహాయం కావాల్సిన కారణం",
    "careme_nearby_requests": "సమీపంలోని కేర్-మీ అభ్యర్థనలు",
    "careme_donor_accept_btn": "భోజనం అందిస్తాను (స్వీకరించండి)",
    "careme_chat_title": "ప్రత్యక్ష సంభాషణ మరియు సమావేశ ప్రదేశం",
    "careme_chat_placeholder": "కలిసే స్థలం సమన్వయం కోసం సందేశం రాయండి...",

    // Celebration
    "celeb_title": "మాతో కలిసి వేడుక చేసుకోండి",
    "celeb_quote": "“పంచుకున్న సంతోషం రెట్టింపు అవుతుంది. మీ ప్రత్యేక రోజులను అనాథలు, వృద్ధులతో ఆహారం పంచుకోవడం ద్వారా గుర్తుండిపోయేలా చేసుకోండి.”",
    "celeb_cat_orphanage": "అనాథాశ్రమాలు",
    "celeb_cat_oldage": "వృద్ధాశ్రమాలు",
    "celeb_cat_ngo": "NGO ఆశ్రమాలు",
    "celeb_form_reason": "వేడుక సందర్భం (పుట్టినరోజు, పెళ్లిరోజు, ప్రత్యేక విజయం)",
    "celeb_form_bring": "మీరు ఏమి తీసుకువస్తారు? (భోజనం, కేక్, స్నాక్స్, నిత్యావసరాలు, బహుమతులు)",
    "celeb_form_date": "కోరుకున్న తేదీ",
    "celeb_form_time": "కోరుకున్న సమయం",
    "celeb_form_guests": "హాజరయ్యే వారి సంఖ్య",
    "celeb_form_msg": "ఆశ్రమ వాసులకు మీ సందేశం",
    "celeb_submit_btn": "వేడుక కోసం అభ్యర్థించండి",
    "celeb_accepted_msg": "మేము మీతో కలిసి వేడుక చేసుకోవడానికి సిద్ధంగా ఉన్నాము! మీ అభ్యర్థన ఆమోదించబడింది.",
    "celeb_reminder": "అవును, మేము మీ రాక కోసం ఎదురుచూస్తున్నాము! మా ఆశ్రమంలో వేడుక చేసుకోవడానికి మీకు సాదర స్వాగతం.",

    // Charity Food
    "charity_title": "ధార్మిక ఆహారం & అన్నదానాలు",
    "charity_type_ind": "వ్యక్తిగత అన్నదాన డ్రైవ్",
    "charity_type_temple": "దేవాలయం / గురుద్వారా / ధార్మిక ట్రస్ట్",
    "charity_form_reason": "అన్నదాన కారణం మరియు సందర్భం",
    "charity_gathering": "అంచనా హాజరు",
    "charity_head_name": "ట్రస్టీ / నిర్వాహకుల పేరు",
    "charity_submit": "అన్నదాన ప్రకటనను విడుదల చేయండి",

    // Emergency Relief
    "emergency_title": "అత్యవసర మరియు విపత్తు ఆహార పూల్",
    "emergency_sub": "వరదలు, భూకంపాల వంటి విపత్తుల సమయంలో భారీ ఆహార మరియు సహాయక సామాగ్రి పంపిణీ.",
    "emergency_cause": "విపత్తు కారణం మరియు ప్రభావిత ప్రాంతం",
    "emergency_proof": "అత్యవసర పరిస్థితి ఆధారాలు మరియు ఫోటోలు",
    "emergency_mode_point": "1. స్థానిక సమయ పరిమితి సేకరణ కేంద్రం",
    "emergency_mode_home": "2. భారీ సహాయం కోసం ఇంటి వద్దనే పికప్",
    "emergency_contribute_btn": "అత్యవసర పూల్‌లో భాగస్వామ్యం అవ్వండి",

    // Live Need & Support Map
    "map_title": "లైవ్ మద్దతు మ్యాప్ (Live Map)",
    "map_sub": "ఆకలి ఉన్న ప్రదేశాలు, దాతలు మరియు వాలంటీర్ల నిజ సమయ భౌగోళిక వీక్షణ.",
    "map_legend_need": "🔴 ఆహార అవసరం",
    "map_legend_donor": "🟢 దాత",
    "map_legend_vol": "🔵 వాలంటీర్",
    "map_view_full": "పూర్తి మ్యాప్‌ను తెరవండి",
    "map_filter_all": "అన్ని గుర్తులు",

    // Restaurant Demand Notifications
    "restaurant_alert_title": "రెస్టారెంట్ ముగింపు రిమైండర్",
    "restaurant_alert_msg": "మీ రెస్టారెంట్ 30 నిమిషాల్లో ముగుస్తుంది. దయచేసి మిగిలిన ఆహారాన్ని ఆకలితో ఉన్నవారికి దానం చేయండి.",
    "restaurant_demand_btn": "సమీప రెస్టారెంట్లకు డిమాండ్ అలెర్ట్ పంపండి",

    // Carbon Impact
    "carbon_title": "మీ పర్యావరణ కార్బన్ ప్రభావం",
    "carbon_sub": "ఆహార వృథాను అరికట్టడం ద్వారా ఆపబడిన గ్రీన్‌హౌస్ వాయు ఉద్గారాల ఖచ్చిత లెక్క.",
    "carbon_calc_msg": "మీ మిగులు ఆహారం వృథాగా పోలేదు. అది ఒకరి కడుపు నింపి, భూమిని కాపాడింది.",
    "carbon_co2_avoided": "కేజీల CO₂ ఆపబడింది",
    "carbon_meals_rescued": "కాపాడిన భోజనాలు",
    "carbon_methane": "నివారించిన మీథేన్ వాయువు",

    // Food Matters News Corner
    "news_title": "ఆహార విశేషాలు — కంచం దాటిన లోకం",
    "news_sub": "స్ఫూర్తిదాయక కథలు, ప్రపంచ ఆహార భద్రత మరియు స్థానిక ఆహార రక్షణ చర్యలు.",
    "news_read_more": "మరింత చదవండి",
    "news_latest_badge": "తాజా వార్త",

    // Universal Notifications
    "notif_header": "నోటిఫికేషన్లు",
    "notif_filter_all": "అన్నీ",
    "notif_filter_unread": "చదవనివి",
    "notif_filter_requests": "అభ్యర్థనలు",
    "notif_filter_donations": "దానాలు",
    "notif_filter_updates": "అప్‌డేట్లు",
    "notif_mark_all_read": "అన్నీ చదివినట్లుగా గుర్తించండి",
    "notif_clear": "అన్నీ తొలగించండి",

    // Common UI Text
    "btn_submit": "సమర్పించండి",
    "btn_cancel": "రద్దు చేయండి",
    "btn_back": "వెనుకకు",
    "btn_next": "తదుపరి",
    "btn_accept": "ఆమోదించండి",
    "btn_decline": "తిరస్కరించండి",
    "btn_view_details": "వివరాలు చూడండి",
    "btn_search": "వెతకండి",
    "btn_save": "భద్రపరచండి",
    "btn_verify_otp": "OTPని ధృవీకరించండి",
    "btn_send_otp": "OTP పంపండి",
    "lbl_name": "పూర్తి పేరు",
    "lbl_phone": "ఫోన్ నంబర్",
    "lbl_email": "ఈమెయిల్ చిరునామా",
    "lbl_location": "ప్రదేశం / చిరునామా",
    "lbl_pincode": "పిన్‌కోడ్",
    "lbl_otp": "6 అంకెల OTPని నమోదు చేయండి",
    "msg_loading": "లోడ్ అవుతోంది...",
    "msg_no_results": "ఫలితాలు లేవు.",
    "msg_success": "విజయవంతంగా పూర్తయింది!",
    "msg_otp_sent": "డెమో OTP 123456 పంపబడింది.",
    "msg_otp_verified": "ఫోన్ విజయవంతంగా ధృవీకరించబడింది!",
    "footer_rights": "ALMS సామాజిక వేదిక. మిగులు ఆహారం నుండి చిరునవ్వుల దాకా."
  }
};

/**
 * i18n Manager Object
 */
const ALMS_I18N = {
  currentLang: 'en',

  init() {
    const saved = localStorage.getItem('alms-lang') || 'en';
    this.setLanguage(saved, false);

    // Bind all language selectors on the page
    document.querySelectorAll('.lang-select, #languageSelector').forEach(el => {
      el.value = this.currentLang;
      el.addEventListener('change', (e) => {
        this.setLanguage(e.target.value, true);
      });
    });
  },

  t(key, defaultVal = '') {
    const dict = ALMS_TRANSLATIONS[this.currentLang] || ALMS_TRANSLATIONS.en;
    if (dict[key]) return dict[key];
    if (ALMS_TRANSLATIONS.en[key]) return ALMS_TRANSLATIONS.en[key];
    return defaultVal || key;
  },

  setLanguage(lang, persist = true) {
    if (!ALMS_TRANSLATIONS[lang]) lang = 'en';
    this.currentLang = lang;
    if (persist) {
      localStorage.setItem('alms-lang', lang);
    }
    document.documentElement.lang = lang;
    
    // Sync all dropdowns
    document.querySelectorAll('.lang-select, #languageSelector').forEach(el => {
      el.value = lang;
    });

    // Translate DOM elements with data-i18n
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (key) {
        el.innerHTML = this.t(key, el.innerHTML);
      }
    });

    // Translate placeholder attributes
    document.querySelectorAll('[data-i18n-ph]').forEach(el => {
      const key = el.getAttribute('data-i18n-ph');
      if (key) {
        el.setAttribute('placeholder', this.t(key, el.getAttribute('placeholder')));
      }
    });

    // Translate title/aria attributes
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
      const key = el.getAttribute('data-i18n-title');
      if (key) {
        el.setAttribute('title', this.t(key));
      }
    });

    // Dispatch global event for components to re-render dynamic strings
    window.dispatchEvent(new CustomEvent('alms-language-changed', { detail: { lang } }));
  }
};

// Auto initialize on DOMContentLoaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => ALMS_I18N.init());
} else {
  ALMS_I18N.init();
}
