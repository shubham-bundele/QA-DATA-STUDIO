async function test() {
  try {
    const res = await fetch("http://localhost:3000/api/analyze-story", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        story: "As a user, I want to log in with my email and password so I can see my dashboard. It should show an error if my credentials are wrong."
      })
    });
    const text = await res.text();
    console.log("Status:", res.status);
    console.log("Response:", text.substring(0, 1000));
  } catch (err) {
    console.error("Fetch Error:", err);
  }
}
test();
