const API_BASE = "https://dress-body-builder-2.onrender.com/api/";
const GUEST_USER_TOKEN = "e41cac5b45048591b81cf84a7070e78765a58be6"; // Public Guest Only
const ACCESS_CODE = "gGLmcMl6x8TRlYnJXyBCSNPEjttcX8qn"; // Public facing UI Only

// Configs

const TARGET = "_self" // (tab target) Always open new tab ["_blank","_self"]
const SKIP_TYPES = ["eyes","mask","neck"]; // all lowercase

const ANIM_STYLE_ID = 3;

const ROWS_PER_FETCH = 5;

const TYPE_ORDER = {
  hairaccessory:1,
  mouth: 2,
  eyebrows: 3,
  hair: 4,
  shirt: 5,
  sleeves: 6,
  pants: 7,
  shoes: 8,
  tail:9,
  wingl:10,
  wingr:11,
  rightspears:12,
  leftyspears:13
};