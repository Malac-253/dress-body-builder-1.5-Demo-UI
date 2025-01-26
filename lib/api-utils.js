/**
 * Bulk-fetch color designs for many part IDs at once via `graphical_part_id__in`.
 * Returns a map:  { [partId]: [ arrayOfDesignsForThisPart ], ... }
 *
 * Example usage:
 *   const colorDesignMap = await fetchColorDesignsBulk([9,10,11]);
 *   // colorDesignMap[9] => array of color designs for part 9
 */
async function fetchColorDesignsBulk(partIds = []) {
    if (!partIds.length) return {};
  
    // Build `graphical_part_id__in=9,10,11`
    const inString = partIds.join(","); // e.g. "9,10,11"
    // Don’t forget access_code, etc.
    const url = `${API_BASE}color-designs/?graphical_part_id__in=${inString}&access_code=${ACCESS_CODE}`;

    const res = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Token ${GUEST_USER_TOKEN}`
      }
    });
    if (!res.ok) {
      console.error("Bulk color design fetch failed:", res.status);
      return {};
    }
  
    const data = await res.json(); // an array of design objects
    // Build a map
    const map = {};
    data.forEach(cd => {
      const pid = cd.graphical_part_id; // or some field that references the part ID
      if (!map[pid]) map[pid] = [];
      map[pid].push(cd);
    });
    return map;
  }
  