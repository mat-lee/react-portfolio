const fmt = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "long",
  day: "numeric",
  timeZone: "UTC", // frontmatter dates are bare YYYY-MM-DD; don't shift them
});

export const formatDate = (date) => fmt.format(date);
