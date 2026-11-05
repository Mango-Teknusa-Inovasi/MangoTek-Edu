import { useEffect, useRef, useState } from "react";
import { usePortal } from "../cms/PortalContext";
import { api, send } from "../cms/client";
import { Icon } from "./Icon";
export default function ConsultationDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null),
    form = useRef<HTMLFormElement>(null),
    requestId = useRef(crypto.randomUUID());
  const { services } = usePortal();
  const [sent, setSent] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  useEffect(() => {
    if (open && !ref.current?.open) {
      setSent(false);
      ref.current?.showModal();
    }
    if (!open && ref.current?.open) ref.current.close();
  }, [open]);
  useEffect(() => {
    if (sent) ref.current?.querySelector<HTMLElement>("h2")?.focus();
  }, [sent]);
  return (
    <dialog
      ref={ref}
      className="consultation-dialog"
      aria-labelledby="consultation-title"
      onClose={onClose}
    >
      <div className="dialog-body">
        <button
          className="icon-button dialog-close"
          onClick={onClose}
          aria-label="Tutup konsultasi"
        >
          <Icon name="close" />
        </button>
        <span className="dialog-label">Diskusi kebutuhan sekolah</span>
        <h2 id="consultation-title" tabIndex={-1}>
          {sent
            ? "Kebutuhan Anda sudah kami terima."
            : "Apa yang dibutuhkan sekolah Anda?"}
        </h2>
        {sent ? (
          <>
            <p>
              Tim MangoTek akan meninjau permintaan dan menghubungi Anda melalui
              kontak yang diberikan.
            </p>
            <button className="button button-green" onClick={onClose}>
              Selesai
            </button>
          </>
        ) : (
          <form
            ref={form}
            className="consult-form"
            onSubmit={async (e) => {
              e.preventDefault();
              setError("");
              setBusy(true);
              const data = new FormData(e.currentTarget);
              try {
                await api(
                  "/api/inquiries",
                  send("POST", {
                    name: data.get("name"),
                    organization: data.get("organization"),
                    email: data.get("email"),
                    phone: data.get("phone"),
                    message: data.get("message"),
                    services: data.getAll("services"),
                    consent: data.get("consent") === "on",
                    website: data.get("website"),
                    requestId: requestId.current,
                  }),
                );
                setSent(true);
                form.current?.reset();
                requestId.current = crypto.randomUUID();
              } catch (e) {
                setError((e as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            <label>
              Nama
              <input name="name" required maxLength={180} autoComplete="name" />
            </label>
            <label>
              Sekolah / organisasi
              <input
                name="organization"
                required
                maxLength={180}
                autoComplete="organization"
              />
            </label>
            <p className="field-help">
              Isi minimal email atau nomor WhatsApp agar kami dapat menghubungi
              Anda.
            </p>
            <div className="form-pair">
              <label>
                Email
                <input name="email" type="email" autoComplete="email" />
              </label>
              <label>
                WhatsApp
                <input
                  name="phone"
                  type="tel"
                  maxLength={30}
                  autoComplete="tel"
                />
              </label>
            </div>
            <fieldset className="consultation-options">
              <legend>Kebutuhan sekolah</legend>
              {services.map((s) => (
                <label key={s.id}>
                  <input name="services" value={s.id} type="checkbox" />
                  <span>{s.label}</span>
                </label>
              ))}
            </fieldset>
            <label>
              Ceritakan kebutuhan Anda
              <textarea
                name="message"
                required
                minLength={10}
                maxLength={5000}
                rows={4}
              />
            </label>
            <label className="honeypot" aria-hidden="true">
              Website
              <input name="website" tabIndex={-1} autoComplete="off" />
            </label>
            <label className="consent">
              <input name="consent" type="checkbox" required />
              Saya menyetujui penyimpanan data ini oleh MangoTek Edu untuk
              meninjau dan menindaklanjuti kebutuhan sekolah. Data kontak hanya
              dapat diakses admin.
            </label>
            {error && (
              <p role="alert" className="form-error">
                {error}
              </p>
            )}
            <button className="button button-green" disabled={busy}>
              {busy ? "Mengirim…" : "Kirim kebutuhan"}
            </button>
          </form>
        )}
      </div>
    </dialog>
  );
}
