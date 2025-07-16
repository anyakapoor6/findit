"use client";
import { useState, useEffect } from "react";
import { sendEmailNotification } from "../../lib/notifications";
import { createSupabaseClient } from "../../utils/supabaseClient";
const supabase = createSupabaseClient();

export default function ContactPage() {
	const [name, setName] = useState("");
	const [message, setMessage] = useState("");
	const [email, setEmail] = useState("");
	const [photo, setPhoto] = useState<File | null>(null);
	const [status, setStatus] = useState<null | "success" | "error">(null);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		supabase.auth.getSession().then(async ({ data }) => {
			const userEmail = data.session?.user?.email;
			const userId = data.session?.user?.id;
			if (userEmail) setEmail(userEmail);
			if (userId) {
				const { data: profile } = await supabase.from('users').select('name').eq('id', userId).single();
				if (profile?.name) setName(profile.name);
			}
		});
	}, []);

	const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files && e.target.files[0]) {
			setPhoto(e.target.files[0]);
		} else {
			setPhoto(null);
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		console.log('Form submission - Name:', name, 'Email:', email, 'Message:', message);
		if (!message.trim() || !email.trim() || !name.trim()) {
			console.log('Validation failed - Name length:', name.trim().length, 'Email length:', email.trim().length, 'Message length:', message.trim().length);
			setStatus("error");
			return;
		}
		setLoading(true);
		setStatus(null);
		let photoUrl = undefined;
		if (photo) {
			const fileExt = photo.name.split('.').pop();
			const fileName = `contact_${Date.now()}.${fileExt}`;
			const { data, error } = await supabase.storage.from('contact-uploads').upload(fileName, photo);
			if (!error && data) {
				const { data: publicUrlData } = supabase.storage.from('contact-uploads').getPublicUrl(fileName);
				photoUrl = publicUrlData?.publicUrl;
			}
		}
		try {
			// Send contact form data to our API endpoint
			const response = await fetch('/api/contact', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					name,
					email,
					message,
					photoUrl
				})
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || 'Failed to send message');
			}

			setStatus("success");
			setMessage("");
			setEmail("");
			setName("");
			setPhoto(null);
		} catch (error) {
			console.error('Contact form submission error:', error);
			setStatus("error");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div style={{ maxWidth: 500, margin: "3rem auto", padding: 24, background: "#fff", borderRadius: 12, boxShadow: "0 4px 16px rgba(0,0,0,0.08)", color: "#111" }}>
			<h1 style={{ fontSize: "2rem", fontWeight: 700, marginBottom: 16, color: "#111" }}>Contact Us</h1>
			<p style={{ color: "#111", marginBottom: 24 }}>
				Have a question, concern, or feedback? Fill out the form below and we'll get back to you!
			</p>
			<form onSubmit={handleSubmit}>
				<div style={{ marginBottom: 16 }}>
					<label style={{ fontWeight: 600, color: "#111" }}>Your Name</label>
					<input
						type="text"
						value={name}
						onChange={e => setName(e.target.value)}
						required
						style={{ width: "100%", border: "1px solid #bbb", borderRadius: 8, padding: 8, marginTop: 4, color: "#111", background: "#fff" }}
						placeholder="Your name"
					/>
				</div>
				<div style={{ marginBottom: 16 }}>
					<label style={{ fontWeight: 600, color: "#111" }}>Your Email</label>
					<input
						type="email"
						value={email}
						onChange={e => setEmail(e.target.value)}
						required
						style={{ width: "100%", border: "1px solid #bbb", borderRadius: 8, padding: 8, marginTop: 4, color: "#111", background: "#fff" }}
						placeholder="you@email.com"
					/>
				</div>
				<div style={{ marginBottom: 16 }}>
					<label style={{ fontWeight: 600, color: "#111" }}>Your Message</label>
					<textarea
						value={message}
						onChange={e => setMessage(e.target.value)}
						required
						rows={5}
						style={{ width: "100%", border: "1px solid #bbb", borderRadius: 8, padding: 8, marginTop: 4, color: "#111", background: "#fff" }}
						placeholder="Type your concern or feedback here..."
					/>
				</div>
				<div style={{ marginBottom: 16 }}>
					<label style={{ fontWeight: 600, color: "#111" }}>Photo (optional, e.g. screenshot of issue)</label>
					<input
						type="file"
						accept="image/*"
						onChange={handlePhotoChange}
						style={{ marginTop: 4 }}
					/>
					{photo && <div style={{ marginTop: 8, color: '#2563eb', fontSize: '0.97rem' }}>{photo.name}</div>}
				</div>
				<button
					type="submit"
					disabled={loading}
					style={{ width: "100%", background: "#2563eb", color: "#fff", border: "none", borderRadius: 8, padding: "0.9rem 0", fontWeight: 700, fontSize: "1.1rem", cursor: loading ? "not-allowed" : "pointer" }}
				>
					{loading ? "Sending..." : "Send Message"}
				</button>
				{status === "success" && (
					<div style={{ color: "#059669", fontWeight: 600, marginTop: 16 }}>Message sent! We'll get back to you soon.</div>
				)}
				{status === "error" && (
					<div style={{ color: "#dc2626", fontWeight: 600, marginTop: 16 }}>
						Please fill out all required fields and try again.
						{/* Debug info in development */}
						{process.env.NODE_ENV === 'development' && (
							<div style={{ fontSize: '0.8rem', marginTop: 4 }}>
								Name: "{name}", Email: "{email}", Message: "{message}"
							</div>
						)}
					</div>
				)}
			</form>
		</div>
	);
} 