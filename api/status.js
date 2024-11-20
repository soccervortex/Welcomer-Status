// /api/status.js
export default function handler(req, res) {
    res.json({ status: userStatus }); // userStatus must be globally accessible
}