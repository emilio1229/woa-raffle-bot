// Flexible time parser for durations, natural language, and 12-hour dates

export function parseTime(input) {
  input = input.trim().toLowerCase();

  // ------------------------------------------------------------
  // SHORTHAND DURATIONS (30s, 10m, 1h, 7d, 1w, 1mo)
  // ------------------------------------------------------------
  const durationMatch = input.match(/^(\d+)\s*(s|sec|secs|seconds|m|min|mins|minutes|h|hr|hrs|hours|d|day|days|w|wk|wks|week|weeks|mo|month|months)$/);
  if (durationMatch) {
    const value = parseInt(durationMatch[1]);
    const unit = durationMatch[2];

    const multipliers = {
      s: 1000,
      sec: 1000,
      secs: 1000,
      seconds: 1000,
      m: 60000,
      min: 60000,
      mins: 60000,
      minutes: 60000,
      h: 3600000,
      hr: 3600000,
      hrs: 3600000,
      hours: 3600000,
      d: 86400000,
      day: 86400000,
      days: 86400000,
      w: 604800000,
      wk: 604800000,
      wks: 604800000,
      week: 604800000,
      weeks: 604800000,
      mo: 2592000000,
      month: 2592000000,
      months: 2592000000
    };

    return Date.now() + value * multipliers[unit];
  }

  // ------------------------------------------------------------
  // NATURAL LANGUAGE: "in 10 minutes", "in 2 hours"
  // ------------------------------------------------------------
  const inMatch = input.match(/^in\s+(\d+)\s*(seconds?|minutes?|hours?|days?|weeks?|months?)$/);
  if (inMatch) {
    const value = parseInt(inMatch[1]);
    const unit = inMatch[2];

    const multipliers = {
      second: 1000,
      seconds: 1000,
      minute: 60000,
      minutes: 60000,
      hour: 3600000,
      hours: 3600000,
      day: 86400000,
      days: 86400000,
      week: 604800000,
      weeks: 604800000,
      month: 2592000000,
      months: 2592000000
    };

    return Date.now() + value * multipliers[unit];
  }

  // ------------------------------------------------------------
  // NATURAL LANGUAGE: "tomorrow 5pm"
  // ------------------------------------------------------------
  if (input.startsWith("tomorrow")) {
    const now = new Date();
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

    const timeMatch = input.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/);
    if (timeMatch) {
      let hour = parseInt(timeMatch[1]);
      const minute = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
      const ampm = timeMatch[3];

      if (ampm === "pm" && hour < 12) hour += 12;
      if (ampm === "am" && hour === 12) hour = 0;

      tomorrow.setHours(hour, minute, 0, 0);
    } else {
      tomorrow.setHours(12, 0, 0, 0);
    }

    return tomorrow.getTime();
  }

  // ------------------------------------------------------------
  // FULL DATE PARSING (flexible 12-hour or 24-hour)
  // ------------------------------------------------------------
  const dateMatch = input.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})(?:\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?)?$/);

  if (dateMatch) {
    let month = parseInt(dateMatch[1]) - 1;
    let day = parseInt(dateMatch[2]);
    let year = parseInt(dateMatch[3]);
    if (year < 100) year += 2000;

    // FIX: default hour to 0 instead of 12
    let hour = dateMatch[4] ? parseInt(dateMatch[4]) : 0;
    let minute = dateMatch[5] ? parseInt(dateMatch[5]) : 0;
    const ampm = dateMatch[6];

    if (ampm) {
      if (ampm === "pm" && hour < 12) hour += 12;
      if (ampm === "am" && hour === 12) hour = 0;
    }

    const date = new Date(year, month, day, hour, minute, 0, 0);
    return date.getTime();
  }

  return null;
}

