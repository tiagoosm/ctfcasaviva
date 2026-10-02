import { useId, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LuArrowRight, LuMap, LuTrophy } from 'react-icons/lu';
import { challengePath, challenges } from '../challenges';
import Credential from '../components/Credential';
import Button from '../components/ui/Button';
import Select from '../components/ui/Select';
import { useGame } from '../game/GameProvider';
import { CODENAME_MAX_LENGTH } from '../game/gameReducer';
import { GROUPS, isValidGroup } from '../game/groups';
import { getCurrentChallenge, getSummary, isRegistered } from '../game/selectors';
import useDocumentTitle from '../hooks/useDocumentTitle';
import { cn } from '../utils/format';

function Title() {
  const initial = (letter) => <span className="text-brand-orange">{letter}</span>;
  return (
    <h1 className="text-5xl font-bold leading-[1.02] sm:text-6xl lg:text-7xl">
      {initial('C')}apture <br className="hidden sm:block" />
      {initial('T')}he {initial('F')}lag
    </h1>
  );
}

// Renders a text input, or a dropdown when `options` is given
function Field({ label, error, fieldRef, options, placeholder, ...fieldProps }) {
  const id = useId();
  const errorId = `${id}-erro`;
  const shared = {
    ref: fieldRef,
    id,
    'aria-required': 'true',
    'aria-invalid': error ? true : undefined,
    'aria-describedby': error ? errorId : undefined,
    className: cn(
      'mt-1.5 h-12 w-full rounded-xl border-2 bg-ink-950/70 px-4 text-base focus:outline-none',
      error
        ? 'border-danger/70 focus:border-danger'
        : 'border-ink-600 hover:border-fg-subtle focus:border-brand-orange',
    ),
    ...fieldProps,
  };

  return (
    <div>
      <label htmlFor={id} className="block font-display font-semibold">
        {label}
      </label>
      {options ? (
        <Select
          id={id}
          buttonRef={fieldRef}
          value={fieldProps.value}
          onChange={fieldProps.onChange}
          options={options}
          placeholder={placeholder}
          invalid={Boolean(error)}
          describedBy={error ? errorId : undefined}
        />
      ) : (
        <input type="text" {...shared} />
      )}
      {error && (
        <p id={errorId} role="alert" className="mt-1.5 text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

export default function LandingPage() {
  useDocumentTitle('');
  const { state, startMission } = useGame();
  const summary = getSummary(state);
  const current = getCurrentChallenge(state);
  const registered = isRegistered(state);
  const [name, setName] = useState(state.codename);
  const [group, setGroup] = useState(state.group);
  const [errors, setErrors] = useState({});
  const nameRef = useRef(null);
  const groupRef = useRef(null);
  const navigate = useNavigate();

  function handleStart(event) {
    event.preventDefault();
    const nextErrors = {
      name: name.trim() ? undefined : 'Informe seu nome.',
      group: isValidGroup(group) ? undefined : 'Selecione sua turma.',
    };
    setErrors(nextErrors);
    if (nextErrors.name) return nameRef.current?.focus();
    if (nextErrors.group) return groupRef.current?.focus();

    startMission(name, group);
    navigate(current ? challengePath(current) : '/conclusao');
  }

  return (
    <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 pb-16 pt-10 sm:px-6 sm:pt-16 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16 lg:pb-24">
      <div>
        <p className="eyebrow">Operação cas@viva</p>
        <div className="mt-4">
          <Title />
        </div>
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-fg-muted sm:text-xl">
          Uma investigação digital em {challenges.length} etapas. Observe, deduza e decifre.
        </p>

        {!registered && (
          <form onSubmit={handleStart} noValidate className="mt-8 max-w-md space-y-4">
            <Field
              label="Nome"
              fieldRef={nameRef}
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                setErrors((current) => ({ ...current, name: undefined }));
              }}
              maxLength={CODENAME_MAX_LENGTH}
              autoComplete="name"
              error={errors.name}
            />
            <Field
              label="Turma"
              fieldRef={groupRef}
              options={GROUPS}
              placeholder="Selecione sua turma"
              value={group}
              onChange={(value) => {
                setGroup(value);
                setErrors((current) => ({ ...current, group: undefined }));
              }}
              error={errors.group}
            />
            <Button type="submit" size="lg" className="w-full sm:w-auto">
              Iniciar missão <LuArrowRight className="h-5 w-5" aria-hidden="true" />
            </Button>
          </form>
        )}

        {registered && (
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            {summary.isComplete ? (
              <Button to="/conclusao" size="lg">
                <LuTrophy className="h-5 w-5" aria-hidden="true" /> Ver certificado
              </Button>
            ) : (
              <Button to={challengePath(current)} size="lg">
                {summary.hasStarted ? 'Continuar' : 'Iniciar'}: {current.title}{' '}
                <LuArrowRight className="h-5 w-5" aria-hidden="true" />
              </Button>
            )}
            <Button to="/missao" variant="secondary" size="lg">
              <LuMap className="h-5 w-5" aria-hidden="true" /> Mapa da missão
            </Button>
          </div>
        )}
      </div>

      <Credential
        codename={registered ? state.codename : name}
        group={registered ? state.group : group}
      />
    </section>
  );
}
