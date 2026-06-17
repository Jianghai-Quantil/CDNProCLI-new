import { Command } from 'commander';
import { OPERATION_MAP } from '../../schema/query';
import { listProfiles } from '../config';

// ─── Static command tree ────────────────────────────────────────────────────

const TOP_CMDS: string[] = [
  'auth', 'property', 'cert', 'cert-version', 'deploy', 'validation',
  'edge-hostname', 'purge', 'prefetch', 'report', 'log-config',
  'log-aggregation-point', 'annotation', 'hostname', 'webhook',
  'secret', 'service-quota', 'api-permission', 'shield', 'isp',
  'client-region', 'staging-server', 'public-ip', 'origin-fast-route-ip',
  'ip-details', 'system-config', 'admin', 'schema', 'completion',
];

const TOP_CMD_DESCRIPTIONS: Record<string, string> = {
  auth: 'Manage credential profiles',
  property: 'Manage CDN properties',
  cert: 'Manage TLS certificates',
  'cert-version': 'Manage certificate versions',
  deploy: 'Manage deployment tasks',
  validation: 'Validate property configurations',
  'edge-hostname': 'Manage edge hostnames',
  purge: 'Manage cache purge tasks',
  prefetch: 'Manage cache prefetch tasks',
  report: 'Run traffic reports',
  'log-config': 'Manage log configurations',
  'log-aggregation-point': 'Manage log aggregation points',
  annotation: 'Manage annotations',
  hostname: 'Look up hostnames and history',
  webhook: 'Manage webhooks',
  secret: 'Manage secrets',
  'service-quota': 'Manage service quotas',
  'api-permission': 'Manage API permissions',
  shield: 'List origin shields',
  isp: 'List ISPs',
  'client-region': 'List client regions',
  'staging-server': 'List staging servers',
  'public-ip': 'List public IPs',
  'origin-fast-route-ip': 'List origin fast-route IPs',
  'ip-details': 'Look up IP details',
  'system-config': 'Get system configuration',
  admin: 'Admin operations (resellers only)',
  schema: 'Inspect OpenAPI schema for any operation',
  completion: 'Print shell completion script',
};

const SUBCMDS: Record<string, string[]> = {
  auth: ['login', 'logout', 'list', 'switch', 'status'],
  property: ['list', 'get', 'create', 'update', 'delete', 'version'],
  cert: ['list', 'get', 'create', 'update', 'delete', 'download-csr'],
  'cert-version': ['get', 'delete'],
  deploy: ['list', 'get', 'create'],
  validation: ['list', 'get', 'create'],
  'edge-hostname': ['list', 'get', 'create', 'update', 'replace', 'delete'],
  purge: ['create', 'list', 'get', 'summary', 'tokens'],
  prefetch: ['create', 'list', 'get', 'tokens'],
  report: [
    'edge-bandwidth', 'edge-volume', 'edge-upload-volume', 'edge-requests',
    'edge-status-codes', 'origin-volume', 'origin-requests', 'origin-status-codes',
    'interm-volume', 'cpu-time', 'origin-fast-route-requests', 'origin-fast-route-volume',
    'l7-volume', 'l7-bandwidth', 'edge-hostname-requests', 'logs',
    'edge-bandwidth-summary', 'edge-volume-summary', 'edge-requests-summary',
    'edge-status-summary', 'origin-status-summary', 'cpu-summary',
    'l7-volume-summary', 'l7-bandwidth-summary', 'edge-hostname-requests-summary',
  ],
  'log-config': ['list', 'get', 'create', 'update', 'delete'],
  'log-aggregation-point': ['list', 'get', 'create', 'update', 'delete', 'summary'],
  annotation: ['list', 'get', 'create', 'update', 'delete'],
  hostname: ['list', 'get', 'history'],
  webhook: ['list', 'get', 'create', 'update', 'delete'],
  secret: ['list', 'get', 'create', 'update', 'delete'],
  'service-quota': ['list', 'get', 'update'],
  'api-permission': ['get', 'create', 'update', 'delete'],
  shield: ['list', 'get'],
  isp: ['list'],
  'client-region': ['list'],
  'staging-server': ['list'],
  'public-ip': ['list'],
  'origin-fast-route-ip': ['list'],
  'ip-details': ['lookup'],
  'system-config': ['get'],
  admin: ['customer', 'contact', 'api-account', 'apicall'],
  completion: ['bash', 'zsh', 'fish', 'powershell'],
};

// Level 3: subcommands of subcommands
const SUB_SUBCMDS: Record<string, Record<string, string[]>> = {
  property: { version: ['list', 'get', 'create', 'update', 'delete'] },
  hostname: { history: ['list', 'get'] },
  admin: {
    customer: ['list', 'get', 'create', 'update'],
    contact: ['list', 'get', 'create', 'update', 'delete'],
    'api-account': ['list', 'get', 'create', 'update', 'delete'],
    apicall: ['list', 'get'],
  },
};

// ─── Schema helpers ──────────────────────────────────────────────────────────

function schemaResources(): string[] {
  const seen = new Set<string>();
  for (const key of Object.keys(OPERATION_MAP)) seen.add(key.split('.')[0]);
  return [...seen].sort();
}

function schemaOperations(resource: string): string[] {
  const ops: string[] = [];
  for (const key of Object.keys(OPERATION_MAP)) {
    const [res, op] = key.split('.');
    if (res === resource) ops.push(op);
  }
  return ops.sort();
}

// ─── Bash completion ─────────────────────────────────────────────────────────

function generateBashCompletion(): string {
  const topCmds = TOP_CMDS.join(' ');
  const schemaRes = schemaResources().join(' ');

  // Build schema operation switch/case for level 3
  const schemaOpsCase = schemaResources()
    .map(r => `      ${r}) ops="${schemaOperations(r).join(' ')}";;`)
    .join('\n');

  return `\
# CDNPro CLI bash completion
# Install:
#   cdnpro completion bash >> ~/.bashrc && source ~/.bashrc
# Or for system-wide:
#   cdnpro completion bash | sudo tee /etc/bash_completion.d/cdnpro

_cdnpro() {
  local cur prev cmd sub subsub
  COMPREPLY=()

  if type _init_completion &>/dev/null; then
    _init_completion -s 2>/dev/null || return
  else
    cur="\${COMP_WORDS[COMP_CWORD]}"
    prev="\${COMP_WORDS[COMP_CWORD-1]}"
  fi

  cmd="\${COMP_WORDS[1]:-}"
  sub="\${COMP_WORDS[2]:-}"
  subsub="\${COMP_WORDS[3]:-}"
  local GLOBAL="-p --profile --host --user --secret-key -o --output --no-color -v --verbose --on-behalf-of"

  # ── Value completions for flag arguments ──────────────────────────────────
  case "$prev" in
    -p|--profile)
      COMPREPLY=($(compgen -W "$(cdnpro completion _profiles 2>/dev/null)" -- "$cur")); return;;
    -o|--output)
      COMPREPLY=($(compgen -W "table json jsonl" -- "$cur")); return;;
    --target)
      case "$cmd" in
        cert|hostname) COMPREPLY=($(compgen -W "all staging production" -- "$cur"));;
        *)             COMPREPLY=($(compgen -W "staging production" -- "$cur"));;
      esac; return;;
    --sort-order)
      COMPREPLY=($(compgen -W "asc desc" -- "$cur")); return;;
    --report-range)
      COMPREPLY=($(compgen -W "self-only self+children children-only" -- "$cur")); return;;
    --type)
      COMPREPLY=($(compgen -W "fiveminutes hourly daily monthly" -- "$cur")); return;;
    --scheme)
      COMPREPLY=($(compgen -W "http https all" -- "$cur")); return;;
    --action)
      COMPREPLY=($(compgen -W "delete invalidate" -- "$cur")); return;;
    --self-signed)
      COMPREPLY=($(compgen -W "RSA2048 ECC256" -- "$cur")); return;;
    --direction)
      COMPREPLY=($(compgen -W "request response both" -- "$cur")); return;;
    --auto-renew)
      COMPREPLY=($(compgen -W "LE Off" -- "$cur")); return;;
    --group-by)
      COMPREPLY=($(compgen -W "hostnames serverGroups customerIds propertyHostnames legacyTypes" -- "$cur")); return;;
    --method)
      COMPREPLY=($(compgen -W "GET POST PATCH PUT DELETE" -- "$cur")); return;;
    --status)
      case "$cmd" in
        deploy)        COMPREPLY=($(compgen -W "waiting inprogress failed succeeded" -- "$cur"));;
        validation)    COMPREPLY=($(compgen -W "waiting in-progress failed succeeded" -- "$cur"));;
        service-quota) COMPREPLY=($(compgen -W "active suspended trial terminated" -- "$cur"));;
        admin)
          case "$sub" in
            contact)     COMPREPLY=($(compgen -W "active suspended pending" -- "$cur"));;
            api-account) COMPREPLY=($(compgen -W "operator read-only" -- "$cur"));;
          esac;;
      esac; return;;
    --file)
      COMPREPLY=($(compgen -f -- "$cur")); return;;
  esac

  # ── Top-level command completion ──────────────────────────────────────────
  if [[ $COMP_CWORD -eq 1 ]]; then
    COMPREPLY=($(compgen -W "${topCmds}" -- "$cur")); return
  fi

  # ── Flag completion (current word starts with -) ──────────────────────────
  if [[ "$cur" == -* ]]; then
    local flags=""
    case "$cmd" in
      property)
        case "$sub" in
          list)    flags="--search --target --has-config --sort-by --sort-order --limit --offset --all --report-range";;
          create)  flags="--file --example";;
          update)  flags="--file --example --if-unmodified-since";;
          delete)  flags="--confirm";;
          version)
            case "$subsub" in
              list)   flags="--search --sort-by --sort-order --limit --offset --all";;
              create) flags="--file --example";;
              update) flags="--file --example --if-unmodified-since";;
            esac;;
        esac;;
      cert)
        case "$sub" in
          list)   flags="--search --target --ca-only --auto-renew --sort-by --sort-order --limit --offset --all --report-range";;
          create|update) flags="--name --cert --key --ca --self-signed --common-name --san --country --state --city --company --department --email --comments --ca-only --file --example --if-unmodified-since";;
          download-csr) flags="--dcv --out";;
        esac;;
      deploy)
        case "$sub" in
          list)   flags="--from --to --target --status --property --cert --search --task-ids --sort-by --sort-order --limit --offset --all --report-range";;
          create) flags="--target --deploy-property --remove-property --deploy-cert --remove-cert --name --webhook --file --wait --timeout --poll-interval --skip-certificate-check --skip-client-ca-certificate-check --skip-origin-auth-certificate-check --skip-usage-check --example";;
        esac;;
      validation)
        case "$sub" in
          list)   flags="--from --to --property --property-version --status --search --sort-by --sort-order --limit --offset --all --report-range";;
          create) flags="--file --wait --timeout --poll-interval";;
        esac;;
      edge-hostname)
        case "$sub" in
          list)          flags="--search --has-beian --server-groups --sort-by --sort-order --limit --offset --all --report-range";;
          create)        flags="--file --example";;
          update|replace) flags="--file --if-unmodified-since";;
          delete)        flags="--skip-usage-check";;
        esac;;
      purge)
        case "$sub" in
          create)  flags="--target --url --dir --regex --header --action --name --webhook --file --wait --timeout --poll-interval --example";;
          list)    flags="--from --to --target --action --search --sort-by --sort-order --max-success-rate --limit --offset --all --report-range";;
          summary) flags="--from --to --target";;
          tokens)  flags="--target";;
        esac;;
      prefetch)
        case "$sub" in
          create) flags="--file --wait --timeout --poll-interval";;
          list)   flags="--from --to --search --sort-by --sort-order --limit --offset --all --report-range";;
          tokens) flags="--target";;
        esac;;
      report)
        case "$sub" in
          logs)      flags="--from --to --hostname --file";;
          *-summary) flags="--from --to --scheme --hostname --property --property-hostname --server-group --group-by --file";;
          *)         flags="--from --to --type --scheme --hostname --property --property-hostname --server-group --file --report-range";;
        esac;;
      log-config)
        case "$sub" in
          list)   flags="--search --limit --offset --all --report-range";;
          create) flags="--file";;
          update) flags="--file --if-unmodified-since";;
        esac;;
      log-aggregation-point)
        case "$sub" in
          list)   flags="--search --limit --offset --all";;
          create) flags="--file";;
          update) flags="--file --if-unmodified-since";;
        esac;;
      annotation)
        case "$sub" in
          list)   flags="--from --to --type --search --limit --offset --all";;
          create) flags="--file --example";;
          update) flags="--file --if-unmodified-since";;
        esac;;
      hostname)
        case "$sub" in
          list)    flags="--search --target --limit --offset --all --report-range";;
          history) flags="--from --to --search --target --limit --offset --all --report-range";;
        esac;;
      webhook)
        case "$sub" in
          list)   flags="--limit --offset --all --report-range";;
          create) flags="--file";;
          update) flags="--file --if-unmodified-since";;
        esac;;
      secret)
        case "$sub" in
          list)   flags="--search --limit --offset --all";;
          create) flags="--file";;
          update) flags="--file --if-unmodified-since";;
        esac;;
      service-quota)
        case "$sub" in
          list)   flags="--search --status --allow-production --advanced-features --limit --offset --all --report-range";;
          update) flags="--file --if-unmodified-since";;
        esac;;
      api-permission)
        case "$sub" in
          create) flags="--file";;
          update) flags="--file --if-unmodified-since";;
        esac;;
      shield)
        case "$sub" in
          list) flags="--search --used-in-properties --sort-by --sort-order";;
        esac;;
      isp)           flags="--search --region-code --sort-order";;
      client-region) flags="--search --isp-code --sort-order";;
      ip-details)    flags="--file";;
      admin)
        case "$sub" in
          customer)
            case "$subsub" in
              list)         flags="--search --ids --status --products --regional-offices --sort-by --sort-order --limit --offset --all";;
              create|update) flags="--file --example";;
            esac;;
          contact)
            case "$subsub" in
              list)         flags="--search --ids --status --is-master --sort-by --sort-order --limit --offset --all --report-range";;
              create|update) flags="--file --example";;
            esac;;
          api-account)
            case "$subsub" in
              list)         flags="--search --type --sort-by --sort-order --limit --offset --all --report-range";;
              create|update) flags="--file --example";;
            esac;;
          apicall)
            case "$subsub" in
              list) flags="--from --to --method --path --safe --caller --for-customer --status --before --limit --all --report-range";;
            esac;;
        esac;;
      schema) flags="--direction";;
    esac
    COMPREPLY=($(compgen -W "$GLOBAL $flags" -- "$cur")); return
  fi

  # ── Subcommand completion (level 2) ──────────────────────────────────────
  if [[ $COMP_CWORD -eq 2 ]]; then
    case "$cmd" in
      auth)                 COMPREPLY=($(compgen -W "login logout list switch status" -- "$cur"));;
      property)             COMPREPLY=($(compgen -W "list get create update delete version" -- "$cur"));;
      cert)                 COMPREPLY=($(compgen -W "list get create update delete download-csr" -- "$cur"));;
      cert-version)         COMPREPLY=($(compgen -W "get delete" -- "$cur"));;
      deploy)               COMPREPLY=($(compgen -W "list get create" -- "$cur"));;
      validation)           COMPREPLY=($(compgen -W "list get create" -- "$cur"));;
      edge-hostname)        COMPREPLY=($(compgen -W "list get create update replace delete" -- "$cur"));;
      purge)                COMPREPLY=($(compgen -W "create list get summary tokens" -- "$cur"));;
      prefetch)             COMPREPLY=($(compgen -W "create list get tokens" -- "$cur"));;
      report)               COMPREPLY=($(compgen -W "${(SUBCMDS['report'] ?? []).join(' ')}" -- "$cur"));;
      log-config)           COMPREPLY=($(compgen -W "list get create update delete" -- "$cur"));;
      log-aggregation-point) COMPREPLY=($(compgen -W "list get create update delete summary" -- "$cur"));;
      annotation)           COMPREPLY=($(compgen -W "list get create update delete" -- "$cur"));;
      hostname)             COMPREPLY=($(compgen -W "list get history" -- "$cur"));;
      webhook)              COMPREPLY=($(compgen -W "list get create update delete" -- "$cur"));;
      secret)               COMPREPLY=($(compgen -W "list get create update delete" -- "$cur"));;
      service-quota)        COMPREPLY=($(compgen -W "list get update" -- "$cur"));;
      api-permission)       COMPREPLY=($(compgen -W "get create update delete" -- "$cur"));;
      shield)               COMPREPLY=($(compgen -W "list get" -- "$cur"));;
      isp)                  COMPREPLY=($(compgen -W "list" -- "$cur"));;
      client-region)        COMPREPLY=($(compgen -W "list" -- "$cur"));;
      staging-server)       COMPREPLY=($(compgen -W "list" -- "$cur"));;
      public-ip)            COMPREPLY=($(compgen -W "list" -- "$cur"));;
      origin-fast-route-ip) COMPREPLY=($(compgen -W "list" -- "$cur"));;
      ip-details)           COMPREPLY=($(compgen -W "lookup" -- "$cur"));;
      system-config)        COMPREPLY=($(compgen -W "get" -- "$cur"));;
      admin)                COMPREPLY=($(compgen -W "customer contact api-account apicall" -- "$cur"));;
      schema)               COMPREPLY=($(compgen -W "${schemaRes}" -- "$cur"));;
      completion)           COMPREPLY=($(compgen -W "bash zsh fish powershell" -- "$cur"));;
    esac
    return
  fi

  # ── Sub-subcommand completion (level 3) ──────────────────────────────────
  if [[ $COMP_CWORD -eq 3 ]]; then
    case "$cmd" in
      property)
        case "$sub" in
          version) COMPREPLY=($(compgen -W "list get create update delete" -- "$cur"));;
        esac;;
      hostname)
        case "$sub" in
          history) COMPREPLY=($(compgen -W "list get" -- "$cur"));;
        esac;;
      admin)
        case "$sub" in
          customer)    COMPREPLY=($(compgen -W "list get create update" -- "$cur"));;
          contact)     COMPREPLY=($(compgen -W "list get create update delete" -- "$cur"));;
          api-account) COMPREPLY=($(compgen -W "list get create update delete" -- "$cur"));;
          apicall)     COMPREPLY=($(compgen -W "list get" -- "$cur"));;
        esac;;
      schema)
        local ops=""
        case "$sub" in
${schemaOpsCase}
        esac
        COMPREPLY=($(compgen -W "$ops" -- "$cur"));;
    esac
    return
  fi
}

complete -F _cdnpro cdnpro
`;
}

// ─── Zsh completion ──────────────────────────────────────────────────────────

function generateZshCompletion(): string {
  const schemaRes = schemaResources().join(' ');

  // Build per-resource operation completions for schema command
  const schemaOpsFunctions = schemaResources()
    .map(r => {
      const ops = schemaOperations(r).map(o => `'${o}'`).join(' ');
      return `    ${r}) local ops=(${ops}); _describe 'operation' ops;;`;
    })
    .join('\n');

  // Build subcommand helper functions
  const subcmdFunctions = Object.entries(SUBCMDS)
    .filter(([, subs]) => subs.length > 0)
    .map(([cmd, subs]) => {
      const entries = subs.map(s => `'${s}'`).join(' ');
      const safe = cmd.replace(/-/g, '_');
      return `_cdnpro_${safe}() {\n  local cmds=(${entries})\n  _describe 'subcommand' cmds\n}`;
    })
    .join('\n\n');

  return `\
#compdef cdnpro
# CDNPro CLI zsh completion
# Install:
#   cdnpro completion zsh >> ~/.zshrc && source ~/.zshrc
# Or for oh-my-zsh:
#   cdnpro completion zsh > ~/.oh-my-zsh/completions/_cdnpro

_cdnpro() {
  local state context line
  typeset -A opt_args

  _arguments -C \\
    '(-p --profile)'{-p,--profile}'[Credential profile]:profile:($(cdnpro completion _profiles 2>/dev/null))' \\
    '--host[Override API host]:host' \\
    '--user[Override API username]:user' \\
    '--secret-key[Override secret key]:key' \\
    '(-o --output)'{-o,--output}'[Output format]:format:(table json jsonl)' \\
    '--no-color[Disable color output]' \\
    '(-v --verbose)'{-v,--verbose}'[Verbose output]' \\
    '--on-behalf-of[On-Behalf-Of customer ID]:id' \\
    '1:command:->command' \\
    '*::args:->args'

  case $state in
    command)
      local commands=(
        'auth:Manage credential profiles'
        'property:Manage CDN properties'
        'cert:Manage TLS certificates'
        'cert-version:Manage certificate versions'
        'deploy:Manage deployment tasks'
        'validation:Validate property configurations'
        'edge-hostname:Manage edge hostnames'
        'purge:Manage cache purge tasks'
        'prefetch:Manage cache prefetch tasks'
        'report:Run traffic reports'
        'log-config:Manage log configurations'
        'log-aggregation-point:Manage log aggregation points'
        'annotation:Manage annotations'
        'hostname:Look up hostnames and history'
        'webhook:Manage webhooks'
        'secret:Manage secrets'
        'service-quota:Manage service quotas'
        'api-permission:Manage API permissions'
        'shield:List origin shields'
        'isp:List ISPs'
        'client-region:List client regions'
        'staging-server:List staging servers'
        'public-ip:List public IPs'
        'origin-fast-route-ip:List origin fast-route IPs'
        'ip-details:Look up IP details'
        'system-config:Get system configuration'
        'admin:Admin operations (resellers only)'
        'schema:Inspect OpenAPI schema for any operation'
        'completion:Print shell completion script'
      )
      _describe 'command' commands
      ;;
    args)
      local cmd="$line[1]"
      case $cmd in
        auth)                 _cdnpro_auth;;
        property)             _cdnpro_property "$line[2]";;
        cert)                 _cdnpro_cert;;
        cert-version)         _cdnpro_cert_version;;
        deploy)               _cdnpro_deploy;;
        validation)           _cdnpro_validation;;
        edge-hostname)        _cdnpro_edge_hostname;;
        purge)                _cdnpro_purge;;
        prefetch)             _cdnpro_prefetch;;
        report)               _cdnpro_report;;
        log-config)           _cdnpro_log_config;;
        log-aggregation-point) _cdnpro_log_aggregation_point;;
        annotation)           _cdnpro_annotation;;
        hostname)             _cdnpro_hostname;;
        webhook)              _cdnpro_webhook;;
        secret)               _cdnpro_secret;;
        service-quota)        _cdnpro_service_quota;;
        api-permission)       _cdnpro_api_permission;;
        shield)               _cdnpro_shield;;
        admin)                _cdnpro_admin "$line[2]";;
        schema)               _cdnpro_schema "$line[2]";;
        completion)           _cdnpro_completion_cmd;;
      esac
      ;;
  esac
}

_cdnpro_auth() {
  local cmds=('login:Save credentials' 'logout:Remove profile' 'list:List profiles' 'switch:Set default' 'status:Test credentials')
  _describe 'subcommand' cmds
}

_cdnpro_property() {
  local sub=$1
  if [[ -z $sub ]]; then
    local cmds=('list:List properties' 'get:Get a property' 'create:Create a property' 'update:Update a property' 'delete:Delete a property' 'version:Manage property versions')
    _describe 'subcommand' cmds
  elif [[ $sub == version ]]; then
    local cmds=('list:List versions' 'get:Get a version' 'create:Create a version' 'update:Update a version' 'delete:Delete a version')
    _describe 'subcommand' cmds
  fi
}

_cdnpro_cert() {
  local cmds=('list:List certificates' 'get:Get a certificate' 'create:Create a certificate' 'update:Update a certificate' 'delete:Delete a certificate' 'download-csr:Download CSR')
  _describe 'subcommand' cmds
}

_cdnpro_cert_version() {
  local cmds=('get:Get a certificate version' 'delete:Delete a certificate version')
  _describe 'subcommand' cmds
}

_cdnpro_deploy() {
  local cmds=('list:List deployment tasks' 'get:Get a deployment task' 'create:Create a deployment task')
  _describe 'subcommand' cmds
}

_cdnpro_validation() {
  local cmds=('list:List validations' 'get:Get a validation' 'create:Create a validation')
  _describe 'subcommand' cmds
}

_cdnpro_edge_hostname() {
  local cmds=('list:List edge hostnames' 'get:Get an edge hostname' 'create:Create an edge hostname' 'update:Update an edge hostname (PATCH)' 'replace:Replace an edge hostname (PUT)' 'delete:Delete an edge hostname')
  _describe 'subcommand' cmds
}

_cdnpro_purge() {
  local cmds=('create:Create a purge task' 'list:List purge tasks' 'get:Get a purge task' 'summary:Get purge summary' 'tokens:Get purge tokens')
  _describe 'subcommand' cmds
}

_cdnpro_prefetch() {
  local cmds=('create:Create a prefetch task' 'list:List prefetch tasks' 'get:Get a prefetch task' 'tokens:Get prefetch tokens')
  _describe 'subcommand' cmds
}

_cdnpro_report() {
  local cmds=(
    'edge-bandwidth:Edge bandwidth (time-series)'
    'edge-volume:Edge volume (time-series)'
    'edge-upload-volume:Edge upload volume (time-series)'
    'edge-requests:Edge requests (time-series)'
    'edge-status-codes:Edge status codes (time-series)'
    'origin-volume:Origin volume (time-series)'
    'origin-requests:Origin requests (time-series)'
    'origin-status-codes:Origin status codes (time-series)'
    'interm-volume:Intermediate volume (time-series)'
    'cpu-time:CPU time (time-series)'
    'origin-fast-route-requests:Origin fast-route requests (time-series)'
    'origin-fast-route-volume:Origin fast-route volume (time-series)'
    'l7-volume:L7 volume (time-series)'
    'l7-bandwidth:L7 bandwidth (time-series)'
    'edge-hostname-requests:Edge hostname requests (time-series)'
    'logs:Download access logs'
    'edge-bandwidth-summary:Edge bandwidth summary'
    'edge-volume-summary:Edge volume summary'
    'edge-requests-summary:Edge requests summary'
    'edge-status-summary:Edge status summary'
    'origin-status-summary:Origin status summary'
    'cpu-summary:CPU time summary'
    'l7-volume-summary:L7 volume summary'
    'l7-bandwidth-summary:L7 bandwidth summary'
    'edge-hostname-requests-summary:Edge hostname requests summary'
  )
  _describe 'subcommand' cmds
}

_cdnpro_log_config() {
  local cmds=('list:List log configs' 'get:Get a log config' 'create:Create a log config' 'update:Update a log config' 'delete:Delete a log config')
  _describe 'subcommand' cmds
}

_cdnpro_log_aggregation_point() {
  local cmds=('list:List aggregation points' 'get:Get an aggregation point' 'create:Create an aggregation point' 'update:Update an aggregation point' 'delete:Delete an aggregation point' 'summary:Get aggregation summary')
  _describe 'subcommand' cmds
}

_cdnpro_annotation() {
  local cmds=('list:List annotations' 'get:Get an annotation' 'create:Create an annotation' 'update:Update an annotation' 'delete:Delete an annotation')
  _describe 'subcommand' cmds
}

_cdnpro_hostname() {
  local cmds=('list:List hostnames' 'get:Get hostname details' 'history:List or get hostname history')
  _describe 'subcommand' cmds
}

_cdnpro_webhook() {
  local cmds=('list:List webhooks' 'get:Get a webhook' 'create:Create a webhook' 'update:Update a webhook' 'delete:Delete a webhook')
  _describe 'subcommand' cmds
}

_cdnpro_secret() {
  local cmds=('list:List secrets' 'get:Get a secret' 'create:Create a secret' 'update:Update a secret' 'delete:Delete a secret')
  _describe 'subcommand' cmds
}

_cdnpro_service_quota() {
  local cmds=('list:List service quotas' 'get:Get a service quota' 'update:Update a service quota')
  _describe 'subcommand' cmds
}

_cdnpro_api_permission() {
  local cmds=('get:Get an API permission' 'create:Create an API permission' 'update:Update an API permission' 'delete:Delete an API permission')
  _describe 'subcommand' cmds
}

_cdnpro_shield() {
  local cmds=('list:List origin shields' 'get:Get an origin shield')
  _describe 'subcommand' cmds
}

_cdnpro_admin() {
  local sub=$1
  if [[ -z $sub ]]; then
    local cmds=('customer:Manage customers' 'contact:Manage contacts' 'api-account:Manage API accounts' 'apicall:List API call logs')
    _describe 'subcommand' cmds
  else
    case $sub in
      customer)    local cmds=('list:List customers' 'get:Get a customer' 'create:Create a customer' 'update:Update a customer'); _describe 'subcommand' cmds;;
      contact)     local cmds=('list:List contacts' 'get:Get a contact' 'create:Create a contact' 'update:Update a contact' 'delete:Delete a contact'); _describe 'subcommand' cmds;;
      api-account) local cmds=('list:List API accounts' 'get:Get an API account' 'create:Create an API account' 'update:Update an API account' 'delete:Delete an API account'); _describe 'subcommand' cmds;;
      apicall)     local cmds=('list:List API calls' 'get:Get an API call'); _describe 'subcommand' cmds;;
    esac
  fi
}

_cdnpro_schema() {
  local resource=$1
  if [[ -z $resource ]]; then
    local resources=(${schemaRes.split(' ').map(r => `'${r}'`).join(' ')})
    _describe 'resource' resources
  else
    case $resource in
${schemaOpsFunctions}
    esac
  fi
}

_cdnpro_completion_cmd() {
  local cmds=('bash:Print bash completion script' 'zsh:Print zsh completion script' 'fish:Print fish completion script' 'powershell:Print PowerShell completion script')
  _describe 'shell' cmds
}

_cdnpro "$@"
`;
}

// ─── Fish completion ──────────────────────────────────────────────────────────

function generateFishCompletion(): string {
  const allTopCmds = TOP_CMDS.join(' ');

  // Generate top-level command completions
  const topCmdLines = TOP_CMDS.map(cmd => {
    const desc = TOP_CMD_DESCRIPTIONS[cmd] ?? '';
    return `complete -c cdnpro -f -n '__cdnpro_no_subcommand' -a ${cmd} -d '${desc}'`;
  }).join('\n');

  // Generate second-level subcommand completions
  const subCmdLines: string[] = [];
  for (const [cmd, subs] of Object.entries(SUBCMDS)) {
    if (subs.length === 0) continue;
    const allSubs = subs.join(' ');
    for (const sub of subs) {
      subCmdLines.push(
        `complete -c cdnpro -f -n '__fish_seen_subcommand_from ${cmd}' -n 'not __fish_seen_subcommand_from ${allSubs}' -a ${sub}`
      );
    }
    subCmdLines.push('');
  }

  // Third level: property version, hostname history, admin sub-resources
  const subSubCmdLines: string[] = [];
  for (const [cmd, subMap] of Object.entries(SUB_SUBCMDS)) {
    for (const [sub, subsubs] of Object.entries(subMap)) {
      const allSubsubs = subsubs.join(' ');
      for (const ss of subsubs) {
        subSubCmdLines.push(
          `complete -c cdnpro -f -n '__fish_seen_subcommand_from ${cmd}' -n '__fish_seen_subcommand_from ${sub}' -n 'not __fish_seen_subcommand_from ${allSubsubs}' -a ${ss}`
        );
      }
    }
  }

  // Schema resource completions
  const schemaRes = schemaResources();
  const schemaResLine = schemaRes
    .map(r => `complete -c cdnpro -f -n '__fish_seen_subcommand_from schema' -n 'not __fish_seen_subcommand_from ${schemaRes.join(' ')}' -a ${r}`)
    .join('\n');

  return `\
# CDNPro CLI fish completion
# Install:
#   cdnpro completion fish | source
# Or to persist:
#   cdnpro completion fish > ~/.config/fish/completions/cdnpro.fish

# Remove prior completions
complete -e -c cdnpro

# ── Helper functions ──────────────────────────────────────────────────────────

function __cdnpro_no_subcommand
    not __fish_seen_subcommand_from ${allTopCmds}
end

# ── Global flags ─────────────────────────────────────────────────────────────

complete -c cdnpro -s p -l profile -d 'Credential profile' -x -a '(cdnpro completion _profiles 2>/dev/null)'
complete -c cdnpro -l host -d 'Override API host'
complete -c cdnpro -l user -d 'Override API username'
complete -c cdnpro -l secret-key -d 'Override secret key'
complete -c cdnpro -s o -l output -d 'Output format' -x -a 'table json jsonl'
complete -c cdnpro -l no-color -d 'Disable color output'
complete -c cdnpro -s v -l verbose -d 'Verbose output'
complete -c cdnpro -l on-behalf-of -d 'On-Behalf-Of customer ID'

# ── Common flag value completions ─────────────────────────────────────────────

complete -c cdnpro -l target -d 'Deployment target' -x -a 'staging production'
complete -c cdnpro -l sort-order -d 'Sort direction' -x -a 'asc desc'
complete -c cdnpro -l report-range -d 'Report scope' -x -a 'self-only self+children children-only'
complete -c cdnpro -l type -d 'Report granularity' -x -a 'fiveminutes hourly daily monthly'
complete -c cdnpro -l scheme -d 'Traffic type' -x -a 'http https all'
complete -c cdnpro -l action -d 'Purge action' -x -a 'delete invalidate'
complete -c cdnpro -l self-signed -d 'Certificate algorithm' -x -a 'RSA2048 ECC256'
complete -c cdnpro -l direction -d 'Schema direction' -x -a 'request response both'
complete -c cdnpro -l group-by -d 'Group-by dimension' -x -a 'hostnames serverGroups customerIds propertyHostnames legacyTypes'
complete -c cdnpro -l method -d 'HTTP method' -x -a 'GET POST PATCH PUT DELETE'

# ── Top-level subcommands ─────────────────────────────────────────────────────

${topCmdLines}

# ── Second-level subcommands ──────────────────────────────────────────────────

${subCmdLines.join('\n')}

# ── Third-level subcommands ───────────────────────────────────────────────────

${subSubCmdLines.join('\n')}

# ── Schema resource completions ───────────────────────────────────────────────

${schemaResLine}
`;
}

// ─── PowerShell completion ────────────────────────────────────────────────────

function generatePowerShellCompletion(): string {
  const topCmds = TOP_CMDS.map(c => `'${c}'`).join(', ');

  const subcmdMap = Object.entries(SUBCMDS)
    .map(([cmd, subs]) => `        '${cmd}' { $subs = @(${subs.map(s => `'${s}'`).join(', ')}) }`)
    .join('\n');

  const schemaRes = schemaResources();
  const schemaResStr = schemaRes.map(r => `'${r}'`).join(', ');
  const schemaOpsMap = schemaRes
    .map(r => `            '${r}' { $ops = @(${schemaOperations(r).map(o => `'${o}'`).join(', ')}) }`)
    .join('\n');

  const subSubMap = Object.entries(SUB_SUBCMDS)
    .flatMap(([cmd, subMap]) =>
      Object.entries(subMap).map(([sub, subsubs]) =>
        `        '${cmd}/${sub}' { $subs = @(${subsubs.map(s => `'${s}'`).join(', ')}) }`
      )
    )
    .join('\n');

  return `\
# CDNPro CLI PowerShell completion
# Install — add to your PowerShell profile:
#   Invoke-Expression (& cdnpro completion powershell)
# Or save to a file and dot-source it:
#   cdnpro completion powershell | Out-File -Encoding utf8 "$env:USERPROFILE\\cdnpro_completion.ps1"
#   . "$env:USERPROFILE\\cdnpro_completion.ps1"

Register-ArgumentCompleter -Native -CommandName @('cdnpro') -ScriptBlock {
  param($wordToComplete, $commandAst, $cursorPosition)

  $elements = $commandAst.CommandElements
  $count    = $elements.Count
  $cmd      = if ($count -ge 2) { $elements[1].Value } else { '' }
  $sub      = if ($count -ge 3) { $elements[2].Value } else { '' }
  $subsub   = if ($count -ge 4) { $elements[3].Value } else { '' }

  # Helper to emit completion results
  function Complete($items) {
    $items | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
      [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterValue', $_)
    }
  }

  # ── Enum flag value completions ─────────────────────────────────────────
  $prevToken = if ($count -ge 2) { $elements[$count - 1].Value } else { '' }
  if ($wordToComplete -notlike '-*' -and $prevToken -like '-*') {
    switch ($prevToken) {
      { $_ -in '-p','--profile' } {
        Complete (& cdnpro completion _profiles 2>$null)
        return
      }
      { $_ -in '-o','--output' } { Complete @('table','json','jsonl'); return }
      '--target' {
        if ($cmd -in 'cert','hostname') { Complete @('all','staging','production') }
        else { Complete @('staging','production') }
        return
      }
      '--sort-order'   { Complete @('asc','desc'); return }
      '--report-range' { Complete @('self-only','self+children','children-only'); return }
      '--type'         { Complete @('fiveminutes','hourly','daily','monthly'); return }
      '--scheme'       { Complete @('http','https','all'); return }
      '--action'       { Complete @('delete','invalidate'); return }
      '--self-signed'  { Complete @('RSA2048','ECC256'); return }
      '--direction'    { Complete @('request','response','both'); return }
      '--group-by'     { Complete @('hostnames','serverGroups','customerIds','propertyHostnames','legacyTypes'); return }
      '--method'       { Complete @('GET','POST','PATCH','PUT','DELETE'); return }
      '--status' {
        switch ($cmd) {
          'deploy'        { Complete @('waiting','inprogress','failed','succeeded'); return }
          'validation'    { Complete @('waiting','in-progress','failed','succeeded'); return }
          'service-quota' { Complete @('active','suspended','trial','terminated'); return }
        }
      }
    }
  }

  # ── Flag name completions ───────────────────────────────────────────────
  if ($wordToComplete -like '-*') {
    $global = @('-p','--profile','--host','--user','--secret-key','-o','--output','--no-color','-v','--verbose','--on-behalf-of')
    $flags = switch ("$cmd/$sub") {
      'property/list'           { @('--search','--target','--has-config','--sort-by','--sort-order','--limit','--offset','--all','--report-range') }
      'property/create'         { @('--file','--example') }
      'property/update'         { @('--file','--example','--if-unmodified-since') }
      'property/delete'         { @('--confirm') }
      'cert/list'               { @('--search','--target','--ca-only','--auto-renew','--sort-by','--sort-order','--limit','--offset','--all','--report-range') }
      { $_ -in 'cert/create','cert/update' } { @('--name','--cert','--key','--ca','--self-signed','--common-name','--san','--country','--state','--city','--company','--department','--email','--comments','--ca-only','--file','--example','--if-unmodified-since') }
      'cert/download-csr'       { @('--dcv','--out') }
      'deploy/list'             { @('--from','--to','--target','--status','--property','--cert','--search','--task-ids','--sort-by','--sort-order','--limit','--offset','--all','--report-range') }
      'deploy/create'           { @('--target','--deploy-property','--remove-property','--deploy-cert','--remove-cert','--name','--webhook','--file','--wait','--timeout','--poll-interval','--skip-certificate-check','--skip-client-ca-certificate-check','--skip-origin-auth-certificate-check','--skip-usage-check','--example') }
      'validation/list'         { @('--from','--to','--property','--property-version','--status','--search','--sort-by','--sort-order','--limit','--offset','--all','--report-range') }
      'validation/create'       { @('--file','--wait','--timeout','--poll-interval') }
      'edge-hostname/list'      { @('--search','--has-beian','--server-groups','--sort-by','--sort-order','--limit','--offset','--all','--report-range') }
      { $_ -in 'edge-hostname/create' } { @('--file','--example') }
      { $_ -in 'edge-hostname/update','edge-hostname/replace' } { @('--file','--if-unmodified-since') }
      'edge-hostname/delete'    { @('--skip-usage-check') }
      'purge/create'            { @('--target','--url','--dir','--regex','--header','--action','--name','--webhook','--file','--wait','--timeout','--poll-interval','--example') }
      'purge/list'              { @('--from','--to','--target','--action','--search','--sort-by','--sort-order','--max-success-rate','--limit','--offset','--all','--report-range') }
      'purge/summary'           { @('--from','--to','--target') }
      'purge/tokens'            { @('--target') }
      'prefetch/create'         { @('--file','--wait','--timeout','--poll-interval') }
      'prefetch/list'           { @('--from','--to','--search','--sort-by','--sort-order','--limit','--offset','--all','--report-range') }
      'prefetch/tokens'         { @('--target') }
      'report/logs'             { @('--from','--to','--hostname','--file') }
      { $sub -like '*-summary'  } { @('--from','--to','--scheme','--hostname','--property','--property-hostname','--server-group','--group-by','--file') }
      { $cmd -eq 'report'       } { @('--from','--to','--type','--scheme','--hostname','--property','--property-hostname','--server-group','--file','--report-range') }
      'schema/'                 { @('--direction') }
      default                   { @() }
    }
    Complete ($global + $flags)
    return
  }

  # ── Top-level command completion ────────────────────────────────────────
  if ($count -le 1 -or ($count -eq 2 -and $wordToComplete -ne '')) {
    Complete @(${topCmds})
    return
  }

  # ── Second-level subcommand completion ──────────────────────────────────
  if ($count -eq 2 -or ($count -eq 3 -and $sub -eq $wordToComplete)) {
    $subs = @()
    switch ($cmd) {
${subcmdMap}
    }
    Complete $subs
    return
  }

  # ── Third-level subcommand completion ───────────────────────────────────
  if ($count -eq 3 -or ($count -eq 4 -and $subsub -eq $wordToComplete)) {
    $subs = @()
    switch ("$cmd/$sub") {
${subSubMap}
    }
    if ($cmd -eq 'schema') {
      $ops = @()
      switch ($sub) {
${schemaOpsMap}
      }
      Complete $ops
      return
    }
    if ($subs.Count -gt 0) { Complete $subs; return }
  }
}
`;
}

// ─── Command registration ────────────────────────────────────────────────────

export function registerCompletionCommand(parent: Command): void {
  const cmd = parent
    .command('completion')
    .description('Print shell completion script for bash, zsh, fish, or PowerShell');

  cmd
    .command('bash')
    .description('Print bash completion script')
    .addHelpText('after', '\nInstall:\n  cdnpro completion bash >> ~/.bashrc && source ~/.bashrc')
    .action(() => { process.stdout.write(generateBashCompletion()); });

  cmd
    .command('zsh')
    .description('Print zsh completion script')
    .addHelpText('after', '\nInstall:\n  cdnpro completion zsh >> ~/.zshrc && source ~/.zshrc')
    .action(() => { process.stdout.write(generateZshCompletion()); });

  cmd
    .command('fish')
    .description('Print fish completion script')
    .addHelpText('after', '\nInstall:\n  cdnpro completion fish > ~/.config/fish/completions/cdnpro.fish')
    .action(() => { process.stdout.write(generateFishCompletion()); });

  cmd
    .command('powershell')
    .description('Print PowerShell completion script')
    .addHelpText('after', '\nInstall:\n  Invoke-Expression (& cdnpro completion powershell)')
    .action(() => { process.stdout.write(generatePowerShellCompletion()); });

  // Hidden subcommand used by the generated scripts for dynamic profile completion.
  // Called as: cdnpro completion _profiles
  cmd
    .command('_profiles', { hidden: true })
    .description('[internal] Print profile names — used by shell completion scripts')
    .action(() => {
      const profiles = listProfiles();
      for (const name of Object.keys(profiles)) {
        process.stdout.write(name + '\n');
      }
    });
}
