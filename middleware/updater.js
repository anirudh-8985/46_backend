export default function updaterOnly(req, res, next) {

  if (!req.user) {
    return res.status(401).json({ error: "Not logged in" });
  }

  if (req.user.role !== "updater") {
    return res.status(403).json({ error: "Updater only" });
  }

  next();
}