using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FattoVirtual.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AgendaTodosSopsEmailTravel : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "DetectedTimeZoneId",
                table: "UserPreferences",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "TravelEndsAtUtc",
                table: "UserPreferences",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TravelLabel",
                table: "UserPreferences",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "TravelModeEnabled",
                table: "UserPreferences",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "TravelTimeZoneId",
                table: "UserPreferences",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "AgendaEventId",
                table: "TodoItems",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DueAtUtc",
                table: "TodoItems",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Priority",
                table: "TodoItems",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Category",
                table: "Sops",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "EstimatedMinutes",
                table: "Sops",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "LastReviewedAtUtc",
                table: "Sops",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Outcome",
                table: "Sops",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "OwnerUserId",
                table: "Sops",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Version",
                table: "Sops",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateTable(
                name: "ClientEmailAccounts",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    OrganizationId = table.Column<Guid>(type: "uuid", nullable: false),
                    ClientId = table.Column<Guid>(type: "uuid", nullable: false),
                    Provider = table.Column<string>(type: "text", nullable: false),
                    EmailAddress = table.Column<string>(type: "text", nullable: false),
                    DisplayName = table.Column<string>(type: "text", nullable: false),
                    IsDemo = table.Column<bool>(type: "boolean", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    EncryptedRefreshToken = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ClientEmailAccounts", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ClientEmailAccounts_Clients_ClientId",
                        column: x => x.ClientId,
                        principalTable: "Clients",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ClientEmailAccounts_Organizations_OrganizationId",
                        column: x => x.OrganizationId,
                        principalTable: "Organizations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SopRuns",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    OrganizationId = table.Column<Guid>(type: "uuid", nullable: false),
                    SopId = table.Column<Guid>(type: "uuid", nullable: false),
                    StartedByUserId = table.Column<string>(type: "text", nullable: false),
                    ClientId = table.Column<Guid>(type: "uuid", nullable: true),
                    Status = table.Column<string>(type: "text", nullable: false),
                    CompletedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Notes = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SopRuns", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SopRuns_Clients_ClientId",
                        column: x => x.ClientId,
                        principalTable: "Clients",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_SopRuns_Organizations_OrganizationId",
                        column: x => x.OrganizationId,
                        principalTable: "Organizations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_SopRuns_Sops_SopId",
                        column: x => x.SopId,
                        principalTable: "Sops",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SopSteps",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    SopId = table.Column<Guid>(type: "uuid", nullable: false),
                    SortOrder = table.Column<int>(type: "integer", nullable: false),
                    Title = table.Column<string>(type: "text", nullable: false),
                    Instruction = table.Column<string>(type: "text", nullable: false),
                    IsCritical = table.Column<bool>(type: "boolean", nullable: false),
                    EstimatedMinutes = table.Column<int>(type: "integer", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SopSteps", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SopSteps_Sops_SopId",
                        column: x => x.SopId,
                        principalTable: "Sops",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ScheduledEmails",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    OrganizationId = table.Column<Guid>(type: "uuid", nullable: false),
                    ClientId = table.Column<Guid>(type: "uuid", nullable: false),
                    ClientEmailAccountId = table.Column<Guid>(type: "uuid", nullable: true),
                    CreatedByUserId = table.Column<string>(type: "text", nullable: false),
                    ToAddress = table.Column<string>(type: "text", nullable: false),
                    ToName = table.Column<string>(type: "text", nullable: true),
                    Subject = table.Column<string>(type: "text", nullable: false),
                    Body = table.Column<string>(type: "text", nullable: false),
                    IsHtml = table.Column<bool>(type: "boolean", nullable: false),
                    ScheduledAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ScheduledInTimeZoneId = table.Column<string>(type: "text", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    ProviderKey = table.Column<string>(type: "text", nullable: true),
                    ProviderMessageId = table.Column<string>(type: "text", nullable: true),
                    Error = table.Column<string>(type: "text", nullable: true),
                    SentAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ScheduledEmails", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ScheduledEmails_ClientEmailAccounts_ClientEmailAccountId",
                        column: x => x.ClientEmailAccountId,
                        principalTable: "ClientEmailAccounts",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_ScheduledEmails_Clients_ClientId",
                        column: x => x.ClientId,
                        principalTable: "Clients",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ScheduledEmails_Organizations_OrganizationId",
                        column: x => x.OrganizationId,
                        principalTable: "Organizations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SopRunSteps",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    SopRunId = table.Column<Guid>(type: "uuid", nullable: false),
                    SopStepId = table.Column<Guid>(type: "uuid", nullable: false),
                    IsCompleted = table.Column<bool>(type: "boolean", nullable: false),
                    CompletedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SopRunSteps", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SopRunSteps_SopRuns_SopRunId",
                        column: x => x.SopRunId,
                        principalTable: "SopRuns",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_SopRunSteps_SopSteps_SopStepId",
                        column: x => x.SopStepId,
                        principalTable: "SopSteps",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_TodoItems_AgendaEventId",
                table: "TodoItems",
                column: "AgendaEventId");

            migrationBuilder.CreateIndex(
                name: "IX_ClientEmailAccounts_ClientId",
                table: "ClientEmailAccounts",
                column: "ClientId");

            migrationBuilder.CreateIndex(
                name: "IX_ClientEmailAccounts_OrganizationId_ClientId_EmailAddress",
                table: "ClientEmailAccounts",
                columns: new[] { "OrganizationId", "ClientId", "EmailAddress" });

            migrationBuilder.CreateIndex(
                name: "IX_ScheduledEmails_ClientEmailAccountId",
                table: "ScheduledEmails",
                column: "ClientEmailAccountId");

            migrationBuilder.CreateIndex(
                name: "IX_ScheduledEmails_ClientId",
                table: "ScheduledEmails",
                column: "ClientId");

            migrationBuilder.CreateIndex(
                name: "IX_ScheduledEmails_OrganizationId",
                table: "ScheduledEmails",
                column: "OrganizationId");

            migrationBuilder.CreateIndex(
                name: "IX_ScheduledEmails_Status_ScheduledAtUtc",
                table: "ScheduledEmails",
                columns: new[] { "Status", "ScheduledAtUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_SopRuns_ClientId",
                table: "SopRuns",
                column: "ClientId");

            migrationBuilder.CreateIndex(
                name: "IX_SopRuns_OrganizationId",
                table: "SopRuns",
                column: "OrganizationId");

            migrationBuilder.CreateIndex(
                name: "IX_SopRuns_SopId",
                table: "SopRuns",
                column: "SopId");

            migrationBuilder.CreateIndex(
                name: "IX_SopRunSteps_SopRunId",
                table: "SopRunSteps",
                column: "SopRunId");

            migrationBuilder.CreateIndex(
                name: "IX_SopRunSteps_SopStepId",
                table: "SopRunSteps",
                column: "SopStepId");

            migrationBuilder.CreateIndex(
                name: "IX_SopSteps_SopId",
                table: "SopSteps",
                column: "SopId");

            migrationBuilder.AddForeignKey(
                name: "FK_TodoItems_AgendaEvents_AgendaEventId",
                table: "TodoItems",
                column: "AgendaEventId",
                principalTable: "AgendaEvents",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_TodoItems_AgendaEvents_AgendaEventId",
                table: "TodoItems");

            migrationBuilder.DropTable(
                name: "ScheduledEmails");

            migrationBuilder.DropTable(
                name: "SopRunSteps");

            migrationBuilder.DropTable(
                name: "ClientEmailAccounts");

            migrationBuilder.DropTable(
                name: "SopRuns");

            migrationBuilder.DropTable(
                name: "SopSteps");

            migrationBuilder.DropIndex(
                name: "IX_TodoItems_AgendaEventId",
                table: "TodoItems");

            migrationBuilder.DropColumn(
                name: "DetectedTimeZoneId",
                table: "UserPreferences");

            migrationBuilder.DropColumn(
                name: "TravelEndsAtUtc",
                table: "UserPreferences");

            migrationBuilder.DropColumn(
                name: "TravelLabel",
                table: "UserPreferences");

            migrationBuilder.DropColumn(
                name: "TravelModeEnabled",
                table: "UserPreferences");

            migrationBuilder.DropColumn(
                name: "TravelTimeZoneId",
                table: "UserPreferences");

            migrationBuilder.DropColumn(
                name: "AgendaEventId",
                table: "TodoItems");

            migrationBuilder.DropColumn(
                name: "DueAtUtc",
                table: "TodoItems");

            migrationBuilder.DropColumn(
                name: "Priority",
                table: "TodoItems");

            migrationBuilder.DropColumn(
                name: "Category",
                table: "Sops");

            migrationBuilder.DropColumn(
                name: "EstimatedMinutes",
                table: "Sops");

            migrationBuilder.DropColumn(
                name: "LastReviewedAtUtc",
                table: "Sops");

            migrationBuilder.DropColumn(
                name: "Outcome",
                table: "Sops");

            migrationBuilder.DropColumn(
                name: "OwnerUserId",
                table: "Sops");

            migrationBuilder.DropColumn(
                name: "Version",
                table: "Sops");
        }
    }
}
