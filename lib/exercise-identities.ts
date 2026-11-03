// Verified against published exercise/media names. A dashboard display-name edit
// must not detach an uploaded demonstration from its exercise identity.
export const uploadedExerciseIdentity: Record<string, string> = {
  "a0b75627-404a-42c5-91b1-1f2777fce73a.mp4": "alternate-arm-leg-plank",
  "e58cd798-a601-4743-9012-48d019f39d2f.mp4": "barbell-wide-bench-press",
  "e91bd216-0773-47e8-8fec-4bb1379ac3bd.mp4": "cable-bar-lateral-pulldown",
  "b51dd4ba-ba0a-4882-a2d5-1d93cfd09730.mp4": "cable-middle-fly",
  "bd5b3a28-ea8e-40eb-869b-d808d270fa90.mp4": "cable-seated-supine-grip-row",
  "28273567-7c06-4d4c-9743-e3343b2abf39.mp4":
    "cable-triceps-pushdown-ez-bar-close-grip",
  "11251842-68a0-4278-abf9-35cfb7dc17dc.mp4": "captains-chair-leg-raise",
  "f9a63b88-2155-4954-ba96-f16f95dcfabb.mp4": "dumbbell-hammer-curl",
  "86a50b54-b41d-47c5-bebe-abca5884b09d.mp4":
    "dumbbell-incline-triceps-extension",
  "8fc342cc-ad8d-46d3-ac89-52f7f228aff5.mp4": "dumbbell-lateral-raises",
  "fc6eab75-1991-4e0c-9ad0-051194846536.mp4": "dumbbell-rear-lunge-stretch",
  "5c4db56f-ec91-4c45-8dc5-1c564cf1fc4a.mp4": "dumbbell-side-bend",
  "caa2fd4a-d3a9-4ef3-a713-d6ab6787f2ab.mp4": "lying-leg-curl-machine",
  "17ae6dfd-2eaa-4a3e-8d27-8fa3c4a1744d.mp4": "preacher-curl-ez-bar-wide-grip",
  "15105d45-d48b-4488-bb2a-c2c9db63cbb3.mp4": "seated-leg-curl-machine",
  "342e8603-ea42-4302-a88e-38d1656b2564.mp4":
    "standing-dumbbell-shoulder-press",
};
export function exerciseIdentity(video?: string | null) {
  return uploadedExerciseIdentity[
    (video || "").split("?")[0].split("/").pop() || ""
  ];
}
