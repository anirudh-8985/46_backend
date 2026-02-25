export default function loaderOnly(req, res, next) {

  if (!req.user || req.user.role !== "loader") {
    return res.status(403).json({
      error: "Loader access only"
    });
  }

  next();
}