function getTrackingParams(url) {
  try {
    const parsed = new URL(url);
    return {
      vibeaff_click: parsed.searchParams.get("vclick") || null,
      vibeaff_program: parsed.searchParams.get("vprg") || null,
      vibeaff_affiliate: parsed.searchParams.get("vaff") || null,
    };
  } catch (_err) {
    return {
      vibeaff_click: null,
      vibeaff_program: null,
      vibeaff_affiliate: null,
    };
  }
}

module.exports = {
  getTrackingParams,
};
